// Mise en page de la lettre du matin : HTML (e-mail) et texte court (WhatsApp).
import { flagOf } from "./flags.mjs";
// Design "refonte" : fond nuit, cartes sobres, chiffres en mono, vert / corail pour le sens, indigo pour l'action.

const HL = { "1J": "1 jour", "1S": "1 semaine", "1M": "1 mois", "3M": "3 mois" };
const ok = (v) => v != null && Number.isFinite(v);
const f2 = (v) => (!ok(v) ? "-" : v.toFixed(2).replace(".", ","));
const f1 = (v) => (!ok(v) ? "-" : v.toFixed(1).replace(".", ","));
const pc = (p) => (!ok(p) ? "-" : Math.round(p * 100) + " %");
const sp = (v) => (!ok(v) ? "-" : (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(2).replace(".", ",") + " %");
const sp1 = (v) => (!ok(v) ? "-" : (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(1).replace(".", ",") + " %");
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const dShort = (d) => { if (!d) return "-"; const x = new Date(d); return `${String(x.getUTCDate()).padStart(2, "0")}/${String(x.getUTCMonth() + 1).padStart(2, "0")}`; };
const dFr = (ms) => new Date(ms).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "Europe/Paris" });
const hFr = (ms) => new Date(ms).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
const mood = (p) => (!ok(p) ? "" : p >= 0.58 ? "avantage net" : p >= 0.53 ? "léger avantage" : p > 0.47 ? "pile ou face" : p > 0.42 ? "plutôt baissier" : "nettement baissier");

// palette
const BG = "#05070B", CARD = "#0F141D", CARD2 = "#161D29", LINE = "#1E2633", TXT = "#EEF2F7", SOFT = "#C9D1DE", DIM = "#8792A6";
const UP = "#34D399", DOWN = "#FF6B5B", BRAND = "#8B93FF", ALERT = "#F5B740";
const GREEN = UP, RED = DOWN, GREY = DIM, AMBER = ALERT;
const SANS = "'Sora',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "'JetBrains Mono','SFMono-Regular',Menlo,Consolas,'Courier New',monospace";
const col = (p) => (p >= 0.53 ? UP : p <= 0.47 ? DOWN : SOFT);
const cchg = (v) => (!ok(v) ? DIM : v >= 0 ? UP : DOWN);

let SITE = "";
const link = (hash, inner, style = `color:inherit;text-decoration:none`) => SITE ? `<a href="${SITE}#/${hash}" style="${style}">${inner}</a>` : inner;
const fl = (sym) => { const f = flagOf(sym); return f ? f + "&nbsp;" : ""; };
const mono = (s, c = TXT, size = 13, w = 600) => `<span style="font-family:${MONO};font-size:${size}px;font-weight:${w};color:${c};white-space:nowrap">${s}</span>`;
const chip = (txt, c, bg, size = 11) => `<span style="display:inline-block;font-size:${size}px;font-weight:600;padding:4px 10px;border-radius:999px;background:${bg};color:${c};white-space:nowrap">${txt}</span>`;
const badge = (txt, today) => chip(txt, today ? UP : ALERT, today ? "rgba(52,211,153,0.12)" : "rgba(245,183,64,0.12)");
const btn = (hash, label) => SITE ? link(hash, label + " &rarr;", `display:inline-block;font-size:12px;font-weight:600;color:${BRAND};text-decoration:none;border:1px solid rgba(139,147,255,0.45);border-radius:999px;padding:8px 14px`) : "";

let SEC = 0;
// en-tete de section : numero mono + titre, filet fin
const card = (title, body, sub = "", hash) => {
  SEC++;
  const n = String(SEC).padStart(2, "0");
  return `<tr><td style="padding:0 0 14px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CARD};border:1px solid ${LINE};border-radius:20px"><tr><td style="padding:20px 20px 18px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-family:${MONO};font-size:11px;letter-spacing:2px;color:${BRAND};white-space:nowrap;padding-right:10px">${n}</td>
      <td style="font-family:${SANS};font-size:16px;font-weight:700;color:${TXT};letter-spacing:-0.2px;width:100%">${title}</td>
      ${hash && SITE ? `<td style="white-space:nowrap;text-align:right">${link(hash, "Voir &rarr;", `font-size:12px;color:${DIM};text-decoration:none`)}</td>` : ""}
    </tr></table>
    ${sub ? `<div style="font-size:12px;line-height:18px;color:${DIM};margin:6px 0 0">${sub}</div>` : ""}
    <div style="height:1px;background:${LINE};margin:14px 0 12px;line-height:1px;font-size:1px">&nbsp;</div>
    ${body}
  </td></tr></table></td></tr>`;
};
const th = (t, right) => `<td style="text-align:${right ? "right" : "left"};padding:0 6px 8px;font-size:11px;color:${DIM};font-weight:500">${t}</td>`;
const td = (t, s = "") => `<td style="padding:9px 6px;font-size:13px;color:${SOFT};border-top:1px solid ${LINE};vertical-align:middle;${s}">${t}</td>`;
const T0 = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">`;

const TONE = { positif: { c: UP, t: "▲" }, négatif: { c: DOWN, t: "▼" }, neutre: { c: DIM, t: "●" } };
function newsList(items, small) {
  if (!items || !items.length) return "";
  return items.map((n, i) => {
    const t = TONE[n.tone] || TONE.neutre;
    return `<div style="padding:${small ? "6px 0 0" : "9px 0"};${!small && i ? `border-top:1px solid ${LINE};` : ""}font-size:${small ? 12 : 13}px;line-height:1.45">
      <span style="color:${t.c};font-size:9px">${t.t}</span>&nbsp; <a href="${esc(n.link)}" style="color:${small ? SOFT : TXT};text-decoration:none">${esc(n.title)}</a>
      <span style="color:${DIM};font-size:11px">&nbsp;· ${esc(n.source)}${n.time ? " · " + hFr(n.time) : ""}</span></div>`;
  }).join("");
}

const ACTION = {
  ENTRER: { t: "Entrer", c: "#062016", bg: UP },
  ATTENDRE_REPLI: { t: "Attendre un repli", c: "#2A1C00", bg: ALERT },
  ATTENDRE_CONFIRMATION: { t: "Attendre la confirmation", c: "#2A1C00", bg: ALERT },
};
const rating = (r) => (!r ? null : String(r).replace(/^[\d.]+\s*-\s*/, "").replace("Strong Buy", "achat fort").replace("Buy", "achat").replace("Hold", "conserver").replace("Underperform", "sous-performance").replace("Sell", "vente"));
const cell = (label, value, sub, c) => `<td width="33%" style="padding:3px"><div style="background:${CARD2};border-radius:12px;padding:10px 6px;text-align:center">
  <div style="font-size:10.5px;color:${DIM}">${label}</div>
  <div style="font-family:${MONO};font-size:15px;font-weight:700;color:${c};margin-top:3px;white-space:nowrap">${value}</div>
  <div style="font-family:${MONO};font-size:11px;color:${c};margin-top:1px">${sub}</div></div></td>`;

function pickCard(p, n) {
  const a = ACTION[p.action] || { t: p.actionLabel, c: TXT, bg: LINE };
  const f = p.fund || {}, perf = p.perf || {};
  const entry = p.action === "ATTENDRE_CONFIRMATION" ? `&gt; ${f2(p.zoneLo)}` : `${f2(p.zoneLo)}–${f2(p.zoneHi)}`;
  const sentence = p.action === "ENTRER"
    ? `Acheter autour de ${mono(f2(p.price))}, viser ${mono(f2(p.target), UP)}, sortir sous ${mono(f2(p.stop), DOWN)}.`
    : p.action === "ATTENDRE_REPLI"
      ? `Pas au cours actuel (${mono(f2(p.price))}). Ordre d'achat entre ${mono(f2(p.zoneLo), BRAND)} et ${mono(f2(p.zoneHi), BRAND)}, valable jusqu'au ${dShort(p.validUntil)}.`
      : `Acheter seulement après une clôture au-dessus de ${mono(f2(p.zoneLo), BRAND)} d'ici le ${dShort(p.validUntil)}. Sinon, on oublie.`;
  const details = [
    `1 mois ${sp1(perf.m1)} · 3 mois ${sp1(perf.m3)} · depuis janv. ${sp1(perf.ytd)}`,
    [ok(p.rsi) ? `RSI ${f1(p.rsi)}` : null, ok(p.support) ? `support ${f2(p.support)}` : null, ok(p.resistance) ? `résistance ${f2(p.resistance)}` : null].filter(Boolean).join(" · "),
    [ok(f.pe) ? `PER ${f1(f.pe)}` : null, ok(f.yield) ? `rendement ${f1(f.yield)} %` : null, rating(f.rating) ? `analystes : ${rating(f.rating)}` : null].filter(Boolean).join(" · "),
  ].filter(Boolean);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};border:1px solid ${LINE};border-radius:16px;margin:0 0 10px"><tr><td style="padding:16px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="vertical-align:top">
        <div style="font-family:${MONO};font-size:11px;color:${DIM};letter-spacing:1px">${String(n).padStart(2, "0")} · ${esc(p.sym)}</div>
        <div style="font-size:17px;font-weight:700;color:${TXT};margin-top:3px">${link("v/" + encodeURIComponent(p.sym), fl(p.sym) + esc(p.name))}</div>
      </td>
      <td style="vertical-align:top;text-align:right;white-space:nowrap">
        <div style="font-family:${MONO};font-size:26px;font-weight:700;color:${col(p.pUp)};letter-spacing:-1px;line-height:28px">${Math.round(p.pUp * 100)}<span style="font-size:14px">%</span></div>
        <div style="font-size:10.5px;color:${DIM}">chances de hausse</div>
      </td></tr></table>
    <div style="margin:12px 0 10px">${chip(a.t, a.c, a.bg, 11.5)} <span style="font-size:12px;color:${DIM}">&nbsp;horizon ${HL[p.h]} · attendu ${mono(sp1(p.expPct), col(p.pUp), 12)}</span></div>
    <div style="font-size:13.5px;line-height:21px;color:${SOFT};margin-bottom:10px">${sentence}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      ${cell("Stop", f2(p.stop), "−" + f1(p.riskPct) + " %", DOWN)}
      ${cell("Entrée", entry, esc(p.cur), BRAND)}
      ${cell("Objectif", f2(p.target), "+" + f1(p.gainPct) + " %", UP)}
    </tr></table>
    <div style="font-size:12px;line-height:19px;color:${DIM};margin-top:10px">
      Objectif avant stop ${mono(pc(p.pTarget), TXT, 12)} · gain/risque ${mono(f1(p.rr) + "×", TXT, 12)} · mise max ${mono(Math.round(p.sizePct || 0) + " %", TXT, 12)} du capital · revoir le ${dShort(p.reviewDate)}
    </div>
    ${p.earningsWarning ? `<div style="margin-top:10px;padding:9px 12px;border-radius:10px;background:rgba(245,183,64,0.10);color:${ALERT};font-size:12px">${esc(p.earningsWarning)}</div>` : ""}
    ${details.length ? `<div style="font-size:11px;line-height:17px;color:${DIM};margin-top:10px;padding-top:10px;border-top:1px solid ${LINE}">${details.map(esc).join("<br>")}</div>` : ""}
    ${p.news?.length ? newsList(p.news.slice(0, 1), true) : ""}
    ${SITE ? `<div style="margin-top:12px">${btn("v/" + encodeURIComponent(p.sym), "Graphique et indicateurs")}</div>` : ""}
  </td></tr></table>`;
}

export function buildLetter({ quizOfDay, siteUrl, dateLabel, brief, indices, picks, avoid, watch, track, modelInfo, news, agenda, earnings, context, movers, failed }) {
  SITE = siteUrl || "";
  SEC = 0;
  const parts = [];

  // ---- en-tete ----
  const cac = (indices || []).find((x) => x.id === "cac") || (indices || [])[0];
  const strong = (agenda?.today || []).filter((e) => e.impact === "fort").length;
  const kpi = (v, l, c) => `<td width="33%" style="padding:4px"><div style="border:1px solid ${LINE};border-radius:14px;padding:12px 10px">
      <div style="font-family:${MONO};font-size:22px;font-weight:700;color:${c};letter-spacing:-0.8px">${v}</div>
      <div style="font-size:11px;color:${DIM};margin-top:2px;line-height:15px">${l}</div></div></td>`;
  parts.push(`<tr><td style="padding:8px 0 22px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="vertical-align:middle"><table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="width:30px;height:30px;background:${BRAND};border-radius:9px;text-align:center;vertical-align:middle;font-family:${MONO};font-weight:700;font-size:15px;color:#0B0E1A">Q</td>
        <td style="padding-left:10px;font-family:${MONO};font-size:11px;letter-spacing:3px;color:${SOFT}">QUANTUM ALGO</td></tr></table></td>
      <td style="text-align:right;font-family:${MONO};font-size:11px;color:${DIM};letter-spacing:1px">${esc(dateLabel)}</td>
    </tr></table>
    <div style="font-size:30px;line-height:36px;font-weight:700;color:${TXT};letter-spacing:-1px;margin:26px 0 6px">La lettre du matin</div>
    <div style="font-size:13.5px;line-height:20px;color:${DIM}">Les marchés, l'agenda et les opportunités du jour, en cinq minutes.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px"><tr>
      ${cac ? kpi(pc(cac.p1M), `chances de hausse<br>${esc(cac.label)} · 1 mois`, col(cac.p1M)) : ""}
      ${kpi(String(picks.length), `opportunité${picks.length > 1 ? "s" : ""}<br>retenue${picks.length > 1 ? "s" : ""}`, picks.length ? UP : SOFT)}
      ${kpi(String(strong), `annonce${strong > 1 ? "s" : ""} fort<br>impact aujourd'hui`, strong ? ALERT : SOFT)}
    </tr></table>
    ${SITE ? `<div style="margin-top:16px"><a href="${SITE}" style="display:inline-block;background:${BRAND};color:#0B0E1A;font-weight:700;font-size:13px;padding:11px 18px;border-radius:12px;text-decoration:none">Ouvrir le tableau de bord &rarr;</a></div>` : ""}
  </td></tr>`);

  if (brief?.length) parts.push(card("L'essentiel", brief.map((b) => `<div style="padding:5px 0;font-size:14px;line-height:21px;color:${SOFT}"><span style="color:${BRAND};font-family:${MONO}">&rsaquo;</span>&nbsp; ${esc(b)}</div>`).join("")));

  if (agenda && (agenda.today?.length || agenda.ok)) {
    const MAXA = 8;
    const allToday = agenda.today || [], allWeek = agenda.week || [];
    const ev = allToday.slice(0, MAXA);
    const more = allToday.length + allWeek.length - MAXA;
    const imp = (e) => e.impact === "fort" ? `<span style="color:${DOWN};font-size:10px;letter-spacing:1px">●●●</span>` : e.impact === "férié" ? `<span style="color:${DIM};font-size:11px">férié</span>` : `<span style="color:${ALERT};font-size:10px;letter-spacing:1px">●●</span>`;
    const body = ev.length
      ? `${T0}${ev.map((e) => `<tr>${td(badge(mono(esc(e.time), UP, 11), true), "width:1%;white-space:nowrap")}${td(`${e.flag} <span style="color:${TXT}">${esc(e.title)}</span><div style="font-size:11px;color:${DIM};margin-top:2px">${esc(e.country)}${e.forecast || e.previous ? ` · prévu ${esc(e.forecast || "-")} / préc. ${esc(e.previous || "-")}` : ""}</div>`)}${td(imp(e), "text-align:right;white-space:nowrap")}</tr>`).join("")}</table>`
      : `<div style="font-size:13px;color:${DIM}">${badge("Aujourd'hui", true)}&nbsp; Aucune annonce importante prévue.</div>`;
    const wk = allWeek.slice(0, Math.max(0, MAXA - ev.length));
    const tmr = wk.length ? `<div style="margin:16px 0 4px;font-family:${MONO};font-size:10.5px;letter-spacing:2px;color:${DIM}">CETTE SEMAINE · FORT IMPACT</div>${T0}${wk.map((e) => `<tr>${td(badge(esc(e.dayLabel), false) + ` ${mono(esc(e.time), SOFT, 11)}`, "white-space:nowrap;width:1%")}${td(`${e.flag} <span style="color:${TXT}">${esc(e.title)}</span><div style="font-size:11px;color:${DIM};margin-top:2px">${esc(e.country)}${e.forecast ? " · prévu " + esc(e.forecast) : ""}</div>`)}</tr>`).join("")}</table>` : "";
    const rest = SITE ? `<div style="margin-top:14px">${btn("today/agenda", more > 0 ? `${more} autre${more > 1 ? "s" : ""} annonce${more > 1 ? "s" : ""} sur le site` : "Agenda complet")}</div>` : "";
    parts.push(card("Agenda économique", body + tmr + rest, "Heure de Paris. ●●● fort impact : les marchés bougent souvent dans les minutes qui suivent.", "today/agenda"));
  }

  if (earnings && (earnings.today?.length || earnings.week?.length)) {
    const t = earnings.today?.length ? earnings.today.map((e) => `<div style="padding:6px 0;font-size:13.5px">${badge("Aujourd'hui" + (e.when ? " · " + esc(e.when) : e.date ? " · " + hFr(e.date) : ""), true)}&nbsp; <b style="color:${TXT}">${link("v/" + encodeURIComponent(e.sym), fl(e.sym) + esc(e.name))}</b></div>`).join("") : "";
    const w = earnings.week?.length ? earnings.week.slice(0, 10).map((e) => `<div style="padding:5px 0;font-size:13px;color:${SOFT}">${badge(dFr(e.date) + (e.estimate ? "*" : ""), false)}&nbsp; ${link("v/" + encodeURIComponent(e.sym), fl(e.sym) + esc(e.name))}</div>`).join("") + (earnings.week.length > 10 ? `<div style="margin-top:10px">${btn("today/agenda", `${earnings.week.length - 10} autres résultats`)}</div>` : "") + (earnings.week.some((e) => e.estimate) ? `<div style="font-size:11px;color:${DIM};margin-top:6px">* date estimée</div>` : "") : "";
    parts.push(card("Résultats d'entreprises", t + w, "Valeurs suivies. Vert : aujourd'hui · ambre : dans les prochains jours."));
  }

  if (context?.length) {
    parts.push(card("Contexte de marché", `${T0}<tr>${th("")}${th("Niveau", true)}${th("Veille", true)}${th("1 mois", true)}</tr>${context.map((c) => `<tr>${td(fl(c.sym) + esc(c.label))}${td(mono(f2(c.last), TXT, 12.5), "text-align:right")}${td(mono(sp(c.chg), c.sym === "^VIX" ? cchg(-c.chg) : cchg(c.chg), 12.5), "text-align:right")}${td(mono(sp1(c.m1), DIM, 12), "text-align:right")}</tr>`).join("")}</table>`));
  }

  parts.push(card("Les indices", `${T0}<tr>${th("Indice")}${th("Veille", true)}${th("1 sem.", true)}${th("1 mois", true)}</tr>${indices.map((x) => `<tr>${td(`<span style="color:${TXT};font-weight:600">${link("indices/" + x.id, fl(x.id) + esc(x.label))}</span><div style="font-size:11px;color:${DIM};margin-top:2px">${esc(x.trend)}</div>`)}${td(mono(sp(x.chg), cchg(x.chg), 12.5), "text-align:right")}${td(mono(pc(x.p1S), col(x.p1S), 13, 700), "text-align:right")}${td(mono(pc(x.p1M), col(x.p1M), 13, 700), "text-align:right")}</tr>`).join("")}</table>`,
    "Les pourcentages sont des chances de hausse sur 100 à l'horizon indiqué, pas des variations. Autour de 50 % : pas d'avis.", "indices"));

  parts.push(card("Opportunités du jour", picks.length ? picks.map((p, i) => pickCard(p, i + 1)).join("") : `<div style="font-size:13.5px;color:${DIM}">Aucune valeur ne présente un avantage suffisant aujourd'hui. Rester à l'écart est aussi une décision.</div>`,
    "De la plus solide à la moins solide. « 58 % » = 58 chances sur 100 de finir plus haut à l'horizon indiqué.", "today/opportunites"));

  if (avoid.length) parts.push(card("À éviter", `${T0}<tr>${th("Valeur")}${th("Hausse", true)}${th("Si détenue", true)}</tr>${avoid.map((p) => `<tr>${td(`<span style="color:${TXT};font-weight:600">${link("v/" + encodeURIComponent(p.sym), fl(p.sym) + esc(p.name))}</span><div style="font-size:11px;color:${DIM};margin-top:2px">${HL[p.h]} · 1 mois ${sp1(p.perf?.m1)}</div>`)}${td(mono(pc(p.pUp), DOWN, 13, 700), "text-align:right")}${td(`<span style="font-size:12px;color:${DIM}">stop</span> ${mono(f2(p.stop), SOFT, 12)}`, "text-align:right;white-space:nowrap")}</tr>`).join("")}</table>`));

  if (watch.length) parts.push(card("Ta liste", `${T0}<tr>${th("Valeur")}${th("Cours", true)}${th("Hausse", true)}</tr>${watch.map((p) => `<tr>${td(`<span style="color:${TXT};font-weight:600">${link("v/" + encodeURIComponent(p.sym), fl(p.sym) + esc(p.name))}</span><div style="font-size:11px;color:${DIM};margin-top:2px">${esc(p.actionLabel)} · ${HL[p.h]}${p.earningsWarning ? ` · <span style="color:${ALERT}">résultats à venir</span>` : ""}</div>`)}${td(mono(f2(p.price), TXT, 12.5) + `<div>${mono(sp(p.chg), cchg(p.chg), 11)}</div>`, "text-align:right")}${td(mono(pc(p.pUp), col(p.pUp), 13, 700), "text-align:right")}</tr>`).join("")}</table>${watch.filter((p) => p.news?.length).map((p) => newsList(p.news.slice(0, 1), true)).join("")}`));

  if (movers && (movers.up?.length || movers.down?.length)) {
    const li = (m) => `<div style="padding:5px 0;font-size:13px;color:${SOFT}">${link("v/" + encodeURIComponent(m.sym), fl(m.sym) + esc(m.name))} ${mono(sp(m.chg), cchg(m.chg), 12)}</div>`;
    parts.push(card("Plus forts mouvements d'hier", `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="50%" style="vertical-align:top;padding-right:8px"><div style="font-family:${MONO};font-size:10.5px;letter-spacing:2px;color:${UP};margin-bottom:4px">HAUSSE</div>${movers.up.map(li).join("")}</td><td style="vertical-align:top"><div style="font-family:${MONO};font-size:10.5px;letter-spacing:2px;color:${DOWN};margin-bottom:4px">BAISSE</div>${movers.down.map(li).join("")}</td></tr></table>`));
  }

  if (news?.length) parts.push(card("Actualités à surveiller", newsList(news), "Dernières 36 heures. ▲ positif · ▼ négatif · ● neutre (estimé à partir du titre).", "today/actus"));

  if (quizOfDay) {
    const q = quizOfDay;
    const opts = q.a.map((a, k) => SITE
      ? `<a href="${SITE}#/apprendre/q/${q.id}/${k}" style="display:block;margin:8px 0 0;padding:11px 14px;border:1px solid ${LINE};background:${BG};border-radius:12px;color:${TXT};text-decoration:none;font-size:14px"><span style="font-family:${MONO};color:${BRAND}">${String.fromCharCode(65 + k)}</span>&nbsp;&nbsp;${esc(a)}</a>`
      : `<div style="margin:6px 0;font-size:14px;color:${SOFT}">${String.fromCharCode(65 + k)}. ${esc(a)}</div>`).join("");
    parts.push(card("La question du jour", `<div style="font-size:15px;line-height:22px;font-weight:600;color:${TXT}">${esc(q.q)}</div>${opts}${SITE ? `<div style="font-size:12px;color:${DIM};margin-top:12px">Touche ta réponse pour voir la correction. ${link("apprendre", "Cours et quiz &rarr;", `color:${BRAND};text-decoration:none`)}</div>` : `<div style="font-size:12px;color:${DIM};margin-top:10px">Réponse : ${String.fromCharCode(65 + q.ok)} — ${esc(q.why)}</div>`}`));
  }

  const trackRows = ["1J", "1S", "1M", "3M"].map((h) => {
    const x = track?.byHorizon?.[h];
    const live = x && x.nConf >= 20 ? mono(pc(x.hitConf / x.nConf), col(x.hitConf / x.nConf), 13, 700) + ` <span style="font-size:11px;color:${DIM}">(${x.nConf})</span>` : `<span style="font-size:12px;color:${DIM}">en mesure</span>`;
    const o = modelInfo?.horizons?.[h]?.oos;
    const v = o ? (o.accConf ?? o.acc) : null;
    return `<tr>${td(HL[h])}${td(live, "text-align:right")}${td(v != null ? mono(pc(v), col(v), 13, 700) : "-", "text-align:right")}</tr>`;
  }).join("");
  parts.push(card("Le modèle se vérifie", `${T0}<tr>${th("Horizon")}${th("En réel", true)}${th("Test 120 séances", true)}</tr>${trackRows}</table>
      ${modelInfo?.summary ? `<div style="font-size:12px;line-height:18px;color:${DIM};margin-top:10px">${esc(modelInfo.summary)}</div>` : ""}
      ${track?.picksSummary ? `<div style="font-size:12px;line-height:18px;color:${DIM};margin-top:6px">Sélections passées : ${mono(sp(track.picksSummary.avg), cchg(track.picksSummary.avg), 12)} en moyenne sur ${track.picksSummary.n} positions, contre ${mono(sp(track.picksSummary.benchAvg), SOFT, 12)} pour l'ensemble.</div>` : ""}`,
    "Bonnes directions quand le modèle avait un avis. 50 % = hasard ; 53 à 56 % de façon régulière est déjà très bon.", "bilan"));

  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
<style>:root{color-scheme:dark}body{margin:0!important;background:${BG}}a{color:inherit}@media (max-width:480px){.wrap{padding:14px 10px!important}}</style></head>
<body style="margin:0;background:${BG};font-family:${SANS};color:${TXT};-webkit-font-smoothing:antialiased">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG}"><tr><td align="center" class="wrap" style="padding:24px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px">
${parts.join("\n")}
<tr><td style="padding:10px 6px 30px;font-size:11px;line-height:17px;color:#5C6679">
  Information statistique générée automatiquement à partir de données différées (Yahoo Finance, ForexFactory, Google Actualités). Ce n'est pas un conseil en investissement personnalisé : les performances passées ne préjugent pas des performances futures et tout investissement en actions peut entraîner une perte en capital.${failed?.length ? ` Données indisponibles ce matin : ${esc(failed.join(", "))}.` : ""}{{UNSUB}}
</td></tr>
</table></td></tr></table></body></html>`;

  // ---- version courte (WhatsApp) ----
  const L = [];
  L.push(`*Quantum Algo – ${dateLabel}*`, "");
  (brief || []).forEach((b) => L.push("• " + b));
  const wkEv = agenda?.week || [];
  const hiEv = (agenda?.today || []).filter((e) => e.impact === "fort");
  if (hiEv.length) { L.push("", "*Agenda (fort impact)*"); hiEv.forEach((e) => L.push(`${e.time} ${e.flag} ${e.title}${e.forecast ? ` (prévu ${e.forecast})` : ""}`)); }
  if (earnings?.today?.length) L.push("", "*Résultats aujourd'hui* : " + earnings.today.map((e) => e.name).join(", "));
  if (wkEv.length) { L.push("", "*À venir (fort impact)*"); wkEv.slice(0, 6).forEach((e) => L.push(`${e.dayLabel} ${e.time} ${e.flag} ${e.title}`)); }
  L.push("", "*Opportunités*");
  if (!picks.length) L.push("Aucune aujourd'hui.");
  picks.forEach((p) => L.push(`• ${p.name} – ${p.actionLabel} (${HL[p.h]}) : ${pc(p.pUp)} de chances de hausse, variation attendue ${sp1(p.expPct)}\n  entrée ${f2(p.zoneLo)}-${f2(p.zoneHi)}, stop ${f2(p.stop)}, objectif ${f2(p.target)}, revoir le ${dShort(p.reviewDate)}${p.earningsWarning ? "\n  ⚠ résultats pendant la position" : ""}`));
  if (avoid.length) { L.push("", "*À éviter*"); avoid.forEach((p) => L.push(`• ${p.name} : ${pc(p.pUp)} de chances de hausse seulement (${HL[p.h]})`)); }
  if (news?.length) { L.push("", "*À lire*"); news.slice(0, 3).forEach((n) => L.push(`• ${n.title} (${n.source})`)); }
  if (quizOfDay) { L.push("", "*🎓 Question du jour* : " + quizOfDay.q); quizOfDay.a.forEach((a, k) => L.push(`${String.fromCharCode(65 + k)}. ${a}`)); if (SITE) L.push("Réponse : " + SITE + "#/apprendre/q/" + quizOfDay.id); }
  if (SITE) L.push("", "Détails : " + SITE);
  L.push("", "_Info statistique, pas un conseil._");
  const whatsapp = L.join("\n");
  const text = whatsapp.replace(/\*/g, "").replace(/_/g, "");
  return { html, text, whatsapp };
}
