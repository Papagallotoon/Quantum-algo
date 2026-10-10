// Mise en page de la lettre du matin : HTML (e-mail) et texte court (WhatsApp).

const HL = { "1J": "1 jour", "1S": "1 semaine", "1M": "1 mois", "3M": "3 mois" };
const ok = (v) => v != null && Number.isFinite(v);
const f2 = (v) => (!ok(v) ? "-" : v.toFixed(2).replace(".", ","));
const f1 = (v) => (!ok(v) ? "-" : v.toFixed(1).replace(".", ","));
const pc = (p) => (!ok(p) ? "-" : Math.round(p * 100) + " %");
const sp = (v) => (!ok(v) ? "-" : (v >= 0 ? "+" : "") + v.toFixed(2).replace(".", ",") + " %");
const sp1 = (v) => (!ok(v) ? "-" : (v >= 0 ? "+" : "") + v.toFixed(1).replace(".", ",") + " %");
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const dShort = (d) => { if (!d) return "-"; const x = new Date(d); return `${String(x.getUTCDate()).padStart(2, "0")}/${String(x.getUTCMonth() + 1).padStart(2, "0")}`; };
const dFr = (ms) => new Date(ms).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "Europe/Paris" });
const hFr = (ms) => new Date(ms).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

const GREEN = "#1f9d63", RED = "#d2483a", GREY = "#6b7280", AMBER = "#b7791f";
const col = (p) => (p >= 0.53 ? GREEN : p <= 0.47 ? RED : GREY);
const cchg = (v) => (!ok(v) ? GREY : v >= 0 ? GREEN : RED);
const TONE = { positif: { c: GREEN, t: "▲ positif" }, négatif: { c: RED, t: "▼ négatif" }, neutre: { c: GREY, t: "• neutre" } };

const th = (t, right) => `<th style="text-align:${right ? "right" : "left"};padding:6px 8px;font-size:11px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb">${t}</th>`;
const td = (t, s = "") => `<td style="padding:7px 8px;font-size:13px;border-bottom:1px solid #f1f3f5;${s}">${t}</td>`;
const card = (title, body, sub = "") => `<div style="background:#fff;border-radius:14px;padding:16px 18px;margin-top:12px"><h3 style="margin:0 0 ${sub ? 2 : 8}px;font-size:17px">${title}</h3>${sub ? `<div style="font-size:12px;color:${GREY};margin-bottom:8px">${sub}</div>` : ""}${body}</div>`;
const row = (k, v) => `<tr><td style="color:${GREY};padding:3px 0;font-size:13px;vertical-align:top">${k}</td><td style="text-align:right;font-size:13px;padding:3px 0">${v}</td></tr>`;

function newsList(items, small) {
  if (!items || !items.length) return "";
  return `<ul style="padding-left:0;list-style:none;margin:${small ? "6px 0 0" : "0"}">${items.map((n) => {
    const t = TONE[n.tone] || TONE.neutre;
    return `<li style="margin:5px 0;font-size:${small ? 12 : 13}px;line-height:1.35"><span style="color:${t.c};font-size:11px;font-weight:600">${t.t}</span> &nbsp;<a href="${esc(n.link)}" style="color:#111827;text-decoration:none">${esc(n.title)}</a> <span style="color:#9ca3af">— ${esc(n.source)}${n.time ? ", " + hFr(n.time) : ""}</span></li>`;
  }).join("")}</ul>`;
}

const ACTION = {
  ENTRER: { t: "ACHETER", bg: "#dcfce7", c: "#166534", how: "Acheter dès l'ouverture" },
  ATTENDRE_REPLI: { t: "ATTENDRE UN REPLI", bg: "#fef3c7", c: "#92400e", how: "Placer un ordre d'achat plus bas" },
  ATTENDRE_CONFIRMATION: { t: "ATTENDRE LA CONFIRMATION", bg: "#fef3c7", c: "#92400e", how: "Acheter seulement si le cours dépasse le seuil" },
};
const rating = (r) => (!r ? null : String(r).replace(/^[\d.]+\s*-\s*/, "").replace("Strong Buy", "achat fort").replace("Buy", "achat").replace("Hold", "conserver").replace("Underperform", "sous-performance").replace("Sell", "vente"));
const box = (label, value, sub, color, bg) => `<td style="width:33%;padding:4px"><div style="background:${bg};border-radius:10px;padding:10px 8px;text-align:center">
  <div style="font-size:10px;letter-spacing:1px;color:${color};font-weight:700">${label}</div>
  <div style="font-size:17px;font-weight:700;color:#111827;margin-top:3px">${value}</div>
  <div style="font-size:11px;color:${color};margin-top:1px">${sub}</div></div></td>`;

function pickCard(p, n) {
  const a = ACTION[p.action] || { t: p.actionLabel.toUpperCase(), bg: "#f3f4f6", c: GREY, how: p.start };
  const f = p.fund || {}, perf = p.perf || {};
  const entry = p.action === "ATTENDRE_CONFIRMATION" ? `> ${f2(p.zoneLo)}` : `${f2(p.zoneLo)}–${f2(p.zoneHi)}`;
  const sentence = p.action === "ENTRER"
    ? `Acheter autour de <b>${f2(p.price)}</b>, viser <b>${f2(p.target)}</b>, sortir si le cours passe sous <b>${f2(p.stop)}</b>.`
    : p.action === "ATTENDRE_REPLI"
      ? `Ne pas acheter au cours actuel (${f2(p.price)}). Ordre d'achat entre <b>${f2(p.zoneLo)}</b> et <b>${f2(p.zoneHi)}</b>, valable jusqu'au ${dShort(p.validUntil)}.`
      : `Acheter seulement si le cours clôture au-dessus de <b>${f2(p.zoneLo)}</b> d'ici le ${dShort(p.validUntil)}. Sinon, on oublie.`;
  const details = [
    `Perf. 1 mois ${sp1(perf.m1)} · 3 mois ${sp1(perf.m3)} · depuis janv. ${sp1(perf.ytd)}`,
    `Support ${f2(p.support)} · résistance ${f2(p.resistance)} · RSI ${f1(p.rsi)}`,
    [ok(f.pe) ? `PER ${f1(f.pe)}` : null, ok(f.yield) ? `rendement ${f1(f.yield)} %` : null, rating(f.rating) ? `analystes : ${rating(f.rating)}` : null, ok(f.target) ? `objectif analystes ${f2(f.target)}` : null].filter(Boolean).join(" · "),
  ].filter(Boolean);
  const reason = p.pros?.length ? `Signaux favorables : ${p.pros.slice(0, 3).join(", ")}.` : "";
  return `
  <div style="border:1px solid #e5e7eb;border-radius:14px;padding:14px;margin:14px 0">
    <table style="width:100%;border-collapse:collapse"><tr>
      <td style="vertical-align:top"><div style="font-size:12px;color:${GREY}">#${n} · ${esc(p.sym)}</div><div style="font-size:18px;font-weight:700">${esc(p.name)}</div></td>
      <td style="text-align:right;vertical-align:top"><div style="font-size:20px;font-weight:800;color:${GREEN}">${pc(p.pUp)}</div><div style="font-size:11px;color:${GREY}">chance de hausse</div></td>
    </tr></table>
    <div style="margin:10px 0 8px"><span style="display:inline-block;background:${a.bg};color:${a.c};font-weight:800;font-size:12px;letter-spacing:.5px;padding:5px 10px;border-radius:999px">${a.t}</span>
      <span style="font-size:12px;color:${GREY};margin-left:6px">horizon ${HL[p.h]} · revoir le ${dShort(p.reviewDate)}</span></div>
    <div style="font-size:14px;line-height:1.45;margin-bottom:8px">${sentence}</div>
    <table style="width:100%;border-collapse:collapse"><tr>
      ${box("ENTRÉE", entry, esc(p.cur), "#1d4ed8", "#eff6ff")}
      ${box("OBJECTIF", f2(p.target), "+" + f1(p.gainPct) + " %", GREEN, "#f0fdf4")}
      ${box("STOP", f2(p.stop), "-" + f1(p.riskPct) + " %", RED, "#fef2f2")}
    </tr></table>
    <div style="font-size:12px;color:#374151;margin-top:8px;line-height:1.5">
      🎯 Objectif atteint avant le stop dans <b>${pc(p.pTarget)}</b> des scénarios · gain/risque <b>${f1(p.rr)}</b><br>
      💶 Mise conseillée : <b>${Math.round(p.sizePct || 0)} %</b> du capital maximum (pour ne perdre que 1 % si le stop est touché)
    </div>
    ${p.earningsWarning ? `<div style="margin-top:8px;padding:7px 10px;border-radius:8px;background:#fffbeb;color:${AMBER};font-size:12px">⚠ ${esc(p.earningsWarning)}</div>` : ""}
    ${reason ? `<div style="font-size:12px;color:#374151;margin-top:8px">✔ ${esc(reason)}</div>` : ""}
    <div style="font-size:11px;color:#9ca3af;margin-top:8px;line-height:1.5;border-top:1px solid #f1f3f5;padding-top:6px">${details.map(esc).join("<br>")}</div>
    ${p.news?.length ? `<div style="margin-top:4px">${newsList(p.news.slice(0, 1), true)}</div>` : ""}
  </div>`;
}

export function buildLetter({ dateLabel, brief, indices, picks, avoid, watch, track, modelInfo, news, agenda, earnings, context, movers, failed }) {
  const parts = [];

  parts.push(`<div style="background:#0a0c10;color:#e8eaec;border-radius:14px;padding:18px 20px">
      <div style="font-family:monospace;letter-spacing:2px;font-size:11px;color:#4fdd9a">QUANTUM ALGO</div>
      <div style="font-size:21px;font-weight:700;margin-top:4px">La lettre du matin</div>
      <div style="font-size:13px;color:#9aa1a9">${esc(dateLabel)}</div>
    </div>`);

  if (brief?.length) parts.push(card("L'essentiel", `<ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.5">${brief.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`));

  if (agenda && (agenda.today?.length || agenda.ok)) {
    const ev = agenda.today || [];
    const body = ev.length
      ? `<table style="width:100%;border-collapse:collapse"><tr>${th("Heure")}${th("Annonce")}${th("Impact")}${th("Prévu / précédent", true)}</tr>${ev.map((e) => `<tr>${td(`<b>${esc(e.time)}</b>`)}${td(`${e.flag} ${esc(e.title)}<div style="font-size:11px;color:#9ca3af">${esc(e.country)}</div>`)}${td(e.impact === "fort" ? `<span style="color:${RED};font-weight:700">●●● fort</span>` : e.impact === "férié" ? `<span style="color:${GREY}">férié</span>` : `<span style="color:${AMBER}">●● moyen</span>`)}${td(`${esc(e.forecast || "-")} / ${esc(e.previous || "-")}`, "text-align:right;white-space:nowrap")}</tr>`).join("")}</table>`
      : `<p style="color:${GREY};margin:0">Aucune annonce importante prévue aujourd'hui.</p>`;
    const tmr = agenda.tomorrow?.length ? `<p style="font-size:12px;color:${GREY};margin:10px 0 0">Demain à surveiller : ${agenda.tomorrow.map((e) => `${e.time} ${e.flag} ${esc(e.title)}`).join(" · ")}</p>` : "";
    parts.push(card("Agenda économique du jour", body + tmr, "Heures de Paris. Les annonces à fort impact font souvent bouger les marchés dans les minutes qui suivent."));
  }

  if (earnings && (earnings.today?.length || earnings.week?.length)) {
    const t = earnings.today?.length ? `<p style="margin:0 0 6px;font-size:14px"><b>Aujourd'hui :</b> ${earnings.today.map((e) => `${esc(e.name)}${e.when ? ` (${esc(e.when)})` : e.date ? ` (${hFr(e.date)})` : ""}`).join(", ")}</p>` : "";
    const w = earnings.week?.length ? `<p style="margin:0;font-size:13px;color:#374151"><b>Cette semaine :</b> ${earnings.week.map((e) => `${esc(e.name)} ${dFr(e.date)}${e.estimate ? "*" : ""}`).join(" · ")}</p><p style="font-size:11px;color:#9ca3af;margin:4px 0 0">* date estimée</p>` : "";
    parts.push(card("Résultats d'entreprises (valeurs suivies)", t + w));
  }

  if (context?.length) {
    parts.push(card("Contexte de marché", `<table style="width:100%;border-collapse:collapse"><tr>${th("")}${th("Niveau", true)}${th("Veille", true)}${th("1 mois", true)}</tr>${context.map((c) => `<tr>${td(esc(c.label))}${td(f2(c.last), "text-align:right")}${td(sp(c.chg), `text-align:right;color:${c.sym === "^VIX" ? cchg(-c.chg) : cchg(c.chg)}`)}${td(sp1(c.m1), "text-align:right;color:" + GREY)}</tr>`).join("")}</table>`));
  }

  parts.push(card("Les indices", `<table style="width:100%;border-collapse:collapse"><tr>${th("Indice")}${th("Veille", true)}${th("1 sem.", true)}${th("Hausse 1 sem.", true)}${th("Hausse 1 mois", true)}${th("Tendance")}</tr>${indices.map((x) => `<tr>${td(`<b>${esc(x.label)}</b>`)}${td(sp(x.chg), `text-align:right;color:${cchg(x.chg)}`)}${td(sp1(x.w1), "text-align:right")}${td(pc(x.p1S), `text-align:right;color:${col(x.p1S)};font-weight:600`)}${td(pc(x.p1M), `text-align:right;color:${col(x.p1M)};font-weight:600`)}${td(`<span style="font-size:12px">${esc(x.trend)}</span>`)}</tr>`).join("")}</table>`, "Probabilités calibrées sur l'historique : 50 % = pas d'avis."));

  parts.push(card("Opportunités du jour", picks.length ? picks.map((p, i) => pickCard(p, i + 1)).join("") : `<p style="color:${GREY}">Aucune valeur ne présente un avantage suffisant aujourd'hui. Rester à l'écart est aussi une décision.</p>`, "De la plus solide à la moins solide. Entrée, objectif et stop sont des prix en devise de cotation."));

  if (avoid.length) parts.push(card("À éviter / alléger", `<table style="width:100%;border-collapse:collapse"><tr>${th("Valeur")}${th("Hausse", true)}${th("Horizon")}${th("Si détenue")}</tr>${avoid.map((p) => `<tr>${td(`<b>${esc(p.name)}</b><div style="font-size:11px;color:#9ca3af">1 mois ${sp1(p.perf?.m1)}</div>`)}${td(pc(p.pUp), `text-align:right;color:${RED};font-weight:600`)}${td(HL[p.h])}${td("protection sous " + f2(p.stop))}</tr>`).join("")}</table>`));

  if (watch.length) parts.push(card("Ta liste", `<table style="width:100%;border-collapse:collapse"><tr>${th("Valeur")}${th("Cours", true)}${th("Action")}${th("Hausse", true)}${th("Horizon")}</tr>${watch.map((p) => `<tr>${td(`<b>${esc(p.name)}</b>${p.earningsWarning ? `<div style="font-size:11px;color:${AMBER}">résultats à venir</div>` : ""}`)}${td(`${f2(p.price)}<div style="font-size:11px;color:${cchg(p.chg)}">${sp(p.chg)}</div>`, "text-align:right")}${td(esc(p.actionLabel))}${td(pc(p.pUp), `text-align:right;color:${col(p.pUp)};font-weight:600`)}${td(HL[p.h])}</tr>`).join("")}</table>${watch.filter((p) => p.news?.length).map((p) => `<div style="margin-top:8px;font-size:11px;color:${GREY};font-weight:600">${esc(p.name.toUpperCase())}</div>${newsList(p.news.slice(0, 1), true)}`).join("")}`));

  if (movers && (movers.up?.length || movers.down?.length)) {
    const li = (m) => `${esc(m.name)} <span style="color:${cchg(m.chg)};font-weight:600">${sp(m.chg)}</span>`;
    parts.push(card("Plus forts mouvements d'hier", `<table style="width:100%"><tr><td style="vertical-align:top;font-size:13px;width:50%"><div style="color:${GREEN};font-weight:600;margin-bottom:4px">En hausse</div>${movers.up.map(li).join("<br>")}</td><td style="vertical-align:top;font-size:13px"><div style="color:${RED};font-weight:600;margin-bottom:4px">En baisse</div>${movers.down.map(li).join("<br>")}</td></tr></table>`));
  }

  if (news?.length) parts.push(card("Actualités à surveiller", newsList(news), "Dernières 36 heures. La tonalité est estimée automatiquement à partir du titre."));

  const trackRows = ["1J", "1S", "1M", "3M"].map((h) => {
    const x = track?.byHorizon?.[h];
    const live = x && x.nConf >= 20 ? pc(x.hitConf / x.nConf) + ` (${x.nConf})` : "en cours de mesure";
    const o = modelInfo?.horizons?.[h]?.oos;
    const test = o ? pc(o.accConf ?? o.acc) : "-";
    return `<tr>${td(HL[h])}${td(live)}${td(test)}</tr>`;
  }).join("");
  parts.push(card("Le modèle se vérifie", `<table style="width:100%;border-collapse:collapse"><tr>${th("Horizon")}${th("Bonne direction en réel")}${th("Test sur 120 séances")}</tr>${trackRows}</table>
      <p style="font-size:12px;color:${GREY};margin:8px 0 0">${esc(modelInfo?.summary || "")}</p>
      ${track?.picksSummary ? `<p style="font-size:12px;color:${GREY};margin:6px 0 0">Sélections passées : ${sp(track.picksSummary.avg)} en moyenne (${track.picksSummary.n} positions), contre ${sp(track.picksSummary.benchAvg)} pour l'ensemble des valeurs.</p>` : ""}`));

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head><body style="margin:0;background:#f4f5f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111827">
  <div style="max-width:660px;margin:0 auto;padding:16px">${parts.join("\n")}
    <p style="font-size:11px;color:#9ca3af;line-height:16px;margin-top:14px">Information statistique générée automatiquement à partir de données différées (Yahoo Finance, calendrier ForexFactory, Google Actualités). Ce n'est pas un conseil en investissement personnalisé : les performances passées ne préjugent pas des performances futures et tout investissement en actions peut entraîner une perte en capital.${failed?.length ? ` Données indisponibles ce matin : ${esc(failed.join(", "))}.` : ""}</p>
  </div></body></html>`;

  // ---- version courte (WhatsApp) ----
  const L = [];
  L.push(`*Quantum Algo – ${dateLabel}*`, "");
  (brief || []).forEach((b) => L.push("• " + b));
  const hiEv = (agenda?.today || []).filter((e) => e.impact === "fort");
  if (hiEv.length) { L.push("", "*Agenda (fort impact)*"); hiEv.forEach((e) => L.push(`${e.time} ${e.flag} ${e.title}${e.forecast ? ` (prévu ${e.forecast})` : ""}`)); }
  if (earnings?.today?.length) L.push("", "*Résultats aujourd'hui* : " + earnings.today.map((e) => e.name).join(", "));
  L.push("", "*Opportunités*");
  if (!picks.length) L.push("Aucune aujourd'hui.");
  picks.forEach((p) => L.push(`• ${p.name} – ${p.actionLabel} (${HL[p.h]}) ${pc(p.pUp)}\n  entrée ${f2(p.zoneLo)}-${f2(p.zoneHi)}, stop ${f2(p.stop)}, objectif ${f2(p.target)}, revoir le ${dShort(p.reviewDate)}${p.earningsWarning ? "\n  ⚠ résultats pendant la position" : ""}`));
  if (avoid.length) { L.push("", "*À éviter*"); avoid.forEach((p) => L.push(`• ${p.name} ${pc(p.pUp)} (${HL[p.h]})`)); }
  if (news?.length) { L.push("", "*À lire*"); news.slice(0, 3).forEach((n) => L.push(`• ${n.title} (${n.source})`)); }
  L.push("", "_Info statistique, pas un conseil._");
  const whatsapp = L.join("\n");
  const text = whatsapp.replace(/\*/g, "").replace(/_/g, "");
  return { html, text, whatsapp };
}
