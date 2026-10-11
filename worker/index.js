// Quantum Algo - service d'inscription a la newsletter (Cloudflare Worker + KV).
//
//  POST /subscribe            { email, consent: true }      -> inscription
//  GET  /unsubscribe?e=..&t=..                              -> desinscription (lien dans chaque lettre)
//  GET  /list                 Authorization: Bearer <ADMIN_TOKEN>  -> liste pour la routine du matin
//
// Les adresses sont stockees dans un espace KV prive de ton compte Cloudflare,
// jamais dans le depot GitHub (qui est public).

const CONSENT_VERSION = "2026-10";

function cors(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
function json(obj, status, env) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { "content-type": "application/json; charset=utf-8", ...cors(env) } });
}
function page(title, body) {
  return new Response(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;background:#0a0c10;color:#e8eaec;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:20px">
<div style="max-width:440px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:26px;text-align:center">
<div style="font-family:monospace;letter-spacing:2px;font-size:11px;color:#4fdd9a">QUANTUM ALGO</div><h1 style="font-size:22px">${title}</h1><p style="color:rgba(232,234,236,.7);line-height:1.5">${body}</p></div></body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8" } });
}

async function hmac(secret, text) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(text));
  return [...new Uint8Array(sig)].slice(0, 16).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const EMAIL_RE = /^[^\s@<>"']{1,64}@[^\s@<>"']{1,190}\.[a-z]{2,24}$/i;

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { headers: cors(env) });

    if (url.pathname === "/subscribe" && req.method === "POST") {
      // anti-abus simple : 5 inscriptions par heure et par adresse IP
      const ip = req.headers.get("cf-connecting-ip") || "?";
      const rk = "rate:" + ip;
      const n = Number((await env.SUBS.get(rk)) || 0);
      if (n >= 5) return json({ ok: false, error: "Trop de tentatives, réessaie plus tard." }, 429, env);
      await env.SUBS.put(rk, String(n + 1), { expirationTtl: 3600 });

      let body = {};
      try { body = await req.json(); } catch (e) {}
      const email = String(body.email || "").trim().toLowerCase();
      if (!EMAIL_RE.test(email)) return json({ ok: false, error: "Adresse e-mail invalide." }, 400, env);
      if (body.consent !== true) return json({ ok: false, error: "Le consentement est obligatoire." }, 400, env);
      if (body.website) return json({ ok: true }, 200, env); // champ piege anti-robot
      const existing = await env.SUBS.get("sub:" + email);
      if (!existing) {
        await env.SUBS.put("sub:" + email, JSON.stringify({ email, since: new Date().toISOString(), consent: CONSENT_VERSION }));
      }
      return json({ ok: true, already: !!existing }, 200, env);
    }

    if (url.pathname === "/unsubscribe") {
      const email = String(url.searchParams.get("e") || "").trim().toLowerCase();
      const t = String(url.searchParams.get("t") || "");
      if (!email || t !== (await hmac(env.SECRET, email))) return page("Lien invalide", "Ce lien de désinscription n'est pas valide. Réponds simplement à un e-mail de la lettre pour être retiré de la liste.");
      await env.SUBS.delete("sub:" + email);
      return page("Désinscription confirmée", "Tu ne recevras plus la lettre du matin à l'adresse " + email.replace(/[<>&"]/g, "") + ". Ton adresse a été supprimée.");
    }

    if (url.pathname === "/list") {
      if (!env.ADMIN_TOKEN || req.headers.get("authorization") !== "Bearer " + env.ADMIN_TOKEN) return json({ ok: false }, 401, env);
      const out = [];
      let cursor;
      do {
        const r = await env.SUBS.list({ prefix: "sub:", cursor });
        for (const k of r.keys) {
          const email = k.name.slice(4);
          out.push({ email, unsub: url.origin + "/unsubscribe?e=" + encodeURIComponent(email) + "&t=" + (await hmac(env.SECRET, email)) });
        }
        cursor = r.list_complete ? null : r.cursor;
      } while (cursor);
      return json({ ok: true, count: out.length, subscribers: out }, 200, env);
    }

    return json({ ok: true, service: "quantum-algo-newsletter" }, 200, env);
  },
};
