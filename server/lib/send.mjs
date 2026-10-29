// Envoi de la newsletter : e-mail (Brevo ou SMTP) et WhatsApp (CallMeBot ou Twilio).
// Tout se configure par variables d'environnement (secrets GitHub), rien en dur.

const env = (k) => (process.env[k] || "").trim();

export function channelsConfigured() {
  const c = [];
  if (env("BREVO_API_KEY") && env("MAIL_TO")) c.push("e-mail (Brevo)");
  else if (env("SMTP_HOST") && env("MAIL_TO")) c.push("e-mail (SMTP)");
  if (env("CALLMEBOT_PHONE") && env("CALLMEBOT_APIKEY")) c.push("WhatsApp (CallMeBot)");
  if (env("TWILIO_SID") && env("TWILIO_TOKEN") && env("WHATSAPP_TO")) c.push("WhatsApp (Twilio)");
  return c;
}

async function sendBrevo(subject, html, text) {
  const to = env("MAIL_TO").split(",").map((e) => ({ email: e.trim() })).filter((x) => x.email);
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": env("BREVO_API_KEY"), "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { name: env("MAIL_FROM_NAME") || "Quantum Algo", email: env("MAIL_FROM") || to[0].email },
      to, subject, htmlContent: html, textContent: text,
    }),
  });
  if (!res.ok) throw new Error(`Brevo ${res.status}: ${await res.text()}`);
}

let transport = null;
async function smtp() {
  if (transport) return transport;
  const nodemailer = (await import("nodemailer")).default;
  const port = Number(env("SMTP_PORT") || 465);
  transport = nodemailer.createTransport({
    host: env("SMTP_HOST"), port, secure: port === 465, pool: true, maxConnections: 1,
    connectionTimeout: 20000, greetingTimeout: 15000, socketTimeout: 30000,
    auth: { user: env("SMTP_USER"), pass: env("SMTP_PASS") },
  });
  return transport;
}
const FROM = () => `"${env("MAIL_FROM_NAME") || "Quantum Algo"}" <${env("MAIL_FROM") || env("SMTP_USER")}>`;
async function sendSmtp(subject, html, text, to, headers) {
  const t = await smtp();
  await t.sendMail({ from: FROM(), to: to || env("MAIL_TO"), subject, html, text, headers });
}

// Abonnes inscrits sur le site (service Cloudflare) : un e-mail individuel chacun,
// avec son lien de desinscription personnel.
export async function fetchSubscribers() {
  const api = env("SUBSCRIBE_API"), tok = env("SUBSCRIBE_TOKEN");
  if (!api || !tok) return { list: [], configured: false };
  const res = await fetch(api.replace(/\/$/, "") + "/list", { headers: { Authorization: "Bearer " + tok }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) { let m = ""; try { m = (await res.json()).error || ""; } catch (e) {} throw new Error("liste des abonnes : HTTP " + res.status + (m ? " - " + m : "")); }
  const j = await res.json();
  return { list: j.subscribers || [], configured: true };
}
// pied de page visible : lien de desinscription personnel (signe) de chaque abonne
function unsubFooter(href) {
  return `<div style="margin-top:22px;padding-top:16px;border-top:1px solid #2a3446;text-align:center;font-size:13px;line-height:1.6">` +
    `<a href="${href}" style="color:#c9d1de;text-decoration:underline;font-weight:600">Se désinscrire de la newsletter</a>` +
    `<div style="color:#6b778c;font-size:11.5px;margin-top:4px">Un clic suffit, sans connexion. Tu peux aussi répondre « stop » à cet e-mail.</div></div>`;
}
export async function sendToSubscribers(list, subject, html, text, exclude) {
  const done = [], errors = [];
  const skip = new Set((exclude || []).map((e) => e.toLowerCase()));
  for (const s of list) {
    if (skip.has(s.email.toLowerCase())) continue;
    const foot = unsubFooter(s.unsub);
    try {
      if (env("SMTP_HOST")) await sendSmtp(subject, html.replace("{{UNSUB}}", foot), text + "\n\nSe désinscrire de la newsletter : " + s.unsub, s.email, { "List-Unsubscribe": `<${s.unsub}>` });
      else throw new Error("SMTP non configure");
      done.push(s.email);
    } catch (e) { errors.push(`${s.email}: ${e.message}`); }
    await new Promise((r) => setTimeout(r, 1200)); // rester sous les limites de Gmail
  }
  return { done, errors };
}

async function sendCallMeBot(text) {
  // CallMeBot accepte des messages courts : on decoupe si besoin
  const parts = [];
  let buf = "";
  for (const line of text.split("\n")) {
    if ((buf + "\n" + line).length > 900) { parts.push(buf); buf = line; } else buf = buf ? buf + "\n" + line : line;
  }
  if (buf) parts.push(buf);
  for (const p of parts) {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(env("CALLMEBOT_PHONE"))}&text=${encodeURIComponent(p)}&apikey=${encodeURIComponent(env("CALLMEBOT_APIKEY"))}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`CallMeBot ${res.status}`);
    await new Promise((r) => setTimeout(r, 2500));
  }
}

async function sendTwilio(text) {
  const sid = env("TWILIO_SID");
  const body = new URLSearchParams({
    From: "whatsapp:" + (env("TWILIO_FROM") || "+14155238886"),
    To: "whatsapp:" + env("WHATSAPP_TO"),
    Body: text.slice(0, 1550),
  });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(`${sid}:${env("TWILIO_TOKEN")}`).toString("base64"), "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Twilio ${res.status}: ${await res.text()}`);
}

export async function sendAll({ subject, html, text, whatsapp }) {
  const done = [], errors = [];
  const tryIt = async (name, fn) => { try { await fn(); done.push(name); } catch (e) { errors.push(`${name}: ${e.message}`); } };
  // copie du proprietaire : meme pied de page que les abonnes (lien vers le site, car il n'est pas dans la liste)
  const own = html.replace("{{UNSUB}}", unsubFooter((env("SITE_URL") || "https://papagallotoon.github.io/Quantum-algo/")));
  if (env("BREVO_API_KEY") && env("MAIL_TO")) await tryIt("e-mail", () => sendBrevo(subject, own, text));
  else if (env("SMTP_HOST") && env("MAIL_TO")) await tryIt("e-mail", () => sendSmtp(subject, own, text));
  if (env("CALLMEBOT_PHONE") && env("CALLMEBOT_APIKEY")) await tryIt("WhatsApp", () => sendCallMeBot(whatsapp));
  if (env("TWILIO_SID") && env("TWILIO_TOKEN") && env("WHATSAPP_TO")) await tryIt("WhatsApp Twilio", () => sendTwilio(whatsapp));
  return { done, errors };
}
