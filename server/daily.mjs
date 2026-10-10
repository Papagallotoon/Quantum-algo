#!/usr/bin/env node
// Quantum Algo - tache quotidienne.
//  1. telecharge 3 ans d'historique pour tout l'univers suivi
//  2. verifie les previsions passees arrivees a echeance (bilan reel)
//  3. re-entraine le modele et ne le remplace que s'il fait mieux (champion/challenger)
//  4. calcule les signaux et plans du jour, les enregistre pour verification future
//  5. envoie la newsletter (e-mail / WhatsApp)
// Options : --fake (donnees synthetiques, pour tester sans reseau)  --no-send  --force-send

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as ta from "../src/quantum/core/ta.js";
import { computeAll, directionalIds } from "../src/quantum/core/signals.js";
import { HORIZONS, HORIZON_KEYS, DEFAULT_MODEL, sigmaAt } from "../src/quantum/core/model.js";
import { evaluateAll, buildPlan, bestHorizon } from "../src/quantum/core/plan.js";
import { trainAll } from "../src/quantum/core/learn.js";
import { INDEX_DEFS, COMPONENTS, NEWS_NAMES, INDEX_QUERY } from "../src/quantum/core/universe.js";
import { fetchMany, fetchCandles } from "./lib/fetch.mjs";
import { fetchAgenda, fetchFundamentals, fetchNasdaqEarnings, fetchNews, dedupeNews, parisDay } from "./lib/extras.mjs";
import { buildLetter } from "./lib/letter.mjs";
import { sendAll, channelsConfigured } from "./lib/send.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "out");
const args = new Set(process.argv.slice(2));
const FAKE = args.has("--fake");
const NO_SEND = args.has("--no-send") || process.env.DRY_RUN === "1";
// un lancement manuel (bouton "Run workflow") envoie la lettre meme le week-end
const FORCE_SEND = args.has("--force-send") || process.env.GITHUB_EVENT_NAME === "workflow_dispatch";
fs.mkdirSync(OUT, { recursive: true });

const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(path.join(OUT, f), "utf8")); } catch { return d; } };
const writeJson = (f, o, compact) => fs.writeFileSync(path.join(OUT, f), JSON.stringify(o, null, compact ? 0 : 1));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

const config = JSON.parse(fs.readFileSync(path.join(HERE, "config.json"), "utf8"));
const MIN_CONF = 0.03;   // une prevision "avec avis" s'ecarte d'au moins 3 points de 50 %

// ---------------------------------------------------------------------------
// 1. Donnees
// ---------------------------------------------------------------------------
const indexOf = {};       // titre -> symbole de son indice
for (const def of INDEX_DEFS) for (const s of COMPONENTS[def.id] || []) if (!indexOf[s]) indexOf[s] = def.symbol;
for (const s of config.extraSymbols || []) if (!indexOf[s]) indexOf[s] = config.extraIndex?.[s] || "^GSPC";
const stocks = Object.keys(indexOf);
const indexSyms = [...new Set(INDEX_DEFS.map((d) => d.symbol))];
const allSyms = [...new Set([...indexSyms, ...stocks])];

log(`univers : ${stocks.length} valeurs, ${indexSyms.length} indices${FAKE ? " (donnees synthetiques)" : ""}`);
let data, failed;
if (FAKE) {
  const { fakeUniverse } = await import("./lib/fake.mjs");
  data = fakeUniverse(allSyms); failed = {};
} else {
  const r = await fetchMany(allSyms, 4);
  data = r.ok; failed = r.failed;
}
log(`telecharge : ${Object.keys(data).length}, echecs : ${Object.keys(failed).length}`, Object.keys(failed).slice(0, 8).join(" "));
if (Object.keys(data).length < 10) { console.error("Trop peu de donnees, arret sans rien modifier."); process.exit(1); }

const names = {};
for (const s of allSyms) names[s] = NEWS_NAMES[s] || data[s]?.name || s;
for (const d of INDEX_DEFS) names[d.symbol] = d.label;

// indicateurs (avec force relative vs l'indice de reference)
const items = [];
const bySym = {};
for (const s of stocks) {
  const c = data[s];
  if (!c || c.close.length < 260) continue;
  const ref = data[indexOf[s]];
  const all = computeAll(c, ref ? ta.alignTo(c.time, ref) : null);
  const it = { sym: s, all, close: c.close, time: c.time, c };
  items.push(it); bySym[s] = it;
}
for (const s of indexSyms) {
  const c = data[s];
  if (!c || c.close.length < 260) continue;
  bySym[s] = { sym: s, all: computeAll(c, null), close: c.close, time: c.time, c, isIndex: true };
}
log(`indicateurs calcules pour ${items.length} valeurs`);

// ---------------------------------------------------------------------------
// 2. Verification des previsions passees
// ---------------------------------------------------------------------------
const journal = readJson("journal.json", { pending: [], stats: {}, picks: [], since: null, changes: [], bench: {} });
journal.stats ||= {}; journal.picks ||= []; journal.changes ||= []; journal.bench ||= {};
const stillPending = [];
let resolved = 0;
for (const e of journal.pending) {
  const it = bySym[e.sym];
  if (!it) { stillPending.push(e); continue; }
  const k = it.time.indexOf(e.t);
  if (k < 0) { if (Date.now() / 1000 - e.t > 200 * 86400) continue; stillPending.push(e); continue; }
  if (k + HORIZONS[e.h] >= it.close.length) { stillPending.push(e); continue; }
  const ret = (it.close[k + HORIZONS[e.h]] / it.close[k] - 1) * 100;
  const st = (journal.stats[e.h] ||= { n: 0, hit: 0, nConf: 0, hitConf: 0, brier: 0 });
  const up = ret > 0;
  st.n++; if ((e.p > 0.5) === up && e.p !== 0.5) st.hit++;
  st.brier += (e.p - (up ? 1 : 0)) ** 2;
  if (Math.abs(e.p - 0.5) >= MIN_CONF) { st.nConf++; if ((e.p > 0.5) === up) st.hitConf++; }
  const b = (journal.bench[e.h] ||= { n: 0, sum: 0 });
  b.n++; b.sum += ret;
  if (e.pick) journal.picks.unshift({ d: e.d, sym: e.sym, name: e.name, h: e.h, p: e.p, ret: Math.round(ret * 100) / 100 });
  resolved++;
}
journal.pending = stillPending;
journal.picks = journal.picks.slice(0, 200);
log(`previsions verifiees : ${resolved}, en attente : ${stillPending.length}`);

// ---------------------------------------------------------------------------
// 3. Apprentissage champion / challenger
// ---------------------------------------------------------------------------
const champion = readJson("model.json", null);
const ids = directionalIds(items[0].all);
const indNames = Object.fromEntries(items[0].all.map((x) => [x.id, x.name]));
const t0 = Date.now();
const { model, report } = trainAll(items, ids, champion && champion.source === "learned" ? champion : null, indNames);
const today = new Date();
const iso = today.toISOString().slice(0, 10);
model.version = iso;
model.createdAt = today.toISOString();
model.universe = items.length;
log(`entrainement : ${((Date.now() - t0) / 1000).toFixed(1)} s`);
const dShort = `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const cfgName = (a) => (a === "vote" ? "vote a poids egaux" : `ridge alpha=${a}`);
for (const h of HORIZON_KEYS) {
  const r = report[h];
  if (!r || r.skipped) continue;
  log(`  ${h}: ${cfgName(r.from)} -> ${cfgName(r.to)} | IC test ${r.oos.ic} | bonne direction ${(r.oos.accConf ?? r.oos.acc) * 100 | 0}%`);
  if (r.configChanged || !champion || champion.source !== "learned") {
    journal.changes.unshift(`${dShort} - ${h} : ${!champion || champion.source !== "learned" ? "premier entrainement" : "nouvelle configuration adoptee"} (${cfgName(r.to)}), ${((r.oos.accConf ?? r.oos.acc) * 100).toFixed(1)} % de bonnes directions sur 120 seances test`);
  }
}
journal.changes = journal.changes.slice(0, 60);
const best = HORIZON_KEYS.map((h) => model.horizons[h]?.oos).filter(Boolean);
model.summary = `Modèle ré-entraîné le ${dShort} sur ${items.length} valeurs et ~3 ans d'historique ; ${Object.values(report).filter((r) => r.configChanged).length} amélioration(s) adoptée(s) aujourd'hui.`;
model.report = Object.fromEntries(Object.entries(report).map(([h, r]) => [h, { ...r, top: (r.top || []).slice(0, 5) }]));

// ---------------------------------------------------------------------------
// 4. Signaux du jour + journal des previsions
// ---------------------------------------------------------------------------
const evalOf = (it) => {
  const i = it.close.length - 1;
  const sg = sigmaAt(it.close, i, 60);
  const evals = evaluateAll(it.all, i, model, sg);
  return { i, sg, evals };
};
const rows = [];
for (const it of items) {
  const { i, sg, evals } = evalOf(it);
  const plan = buildPlan(it.c, evals, sg);
  const rel = Math.max(0.005, plan.reliability?.ic ?? 0.02);
  rows.push({ it, i, evals, plan, rank: (plan.pUp - 0.5) * rel, cur: it.c.currency });
}
const active = new Set(["ENTRER", "ATTENDRE_REPLI", "ATTENDRE_CONFIRMATION"]);
// ---- details par valeur (perf, niveaux, moteurs du signal) ----
const pct = (a, b) => (b ? (a / b - 1) * 100 : null);
function details(r) {
  const C = r.it.close, H = r.it.c.high, L = r.it.c.low, i = r.i, T = r.it.time;
  const yearStart = new Date(new Date().getUTCFullYear(), 0, 1).getTime() / 1000;
  let y0 = T.findIndex((t) => t >= yearStart); if (y0 < 1) y0 = 1;
  const val = (id) => { const x = r.it.all.find((a) => a.id === id); return x ? x.value[i] : null; };
  const hm = model.horizons[r.plan.horizon] || {};
  const contrib = r.it.all.filter((a) => a.sig).map((a) => {
    const sgn = a.sig[i]; const w = hm.weights ? (hm.weights[a.id] || 0) : 1;
    return { name: a.name, c: (Number.isFinite(sgn) ? sgn : 0) * w };
  }).filter((x) => x.c !== 0).sort((a, b) => b.c - a.c);
  return {
    perf: { w1: pct(C[i], C[i - 5]), m1: pct(C[i], C[i - 21]), m3: pct(C[i], C[i - 63]), ytd: pct(C[i], C[y0 - 1]) },
    support: Math.min(...L.slice(i - 19, i + 1)), resistance: Math.max(...H.slice(i - 19, i + 1)),
    sma50: val("sma50"), sma200: val("sma200"), rsi: val("rsi14"), vol: val("hv30"), rs63: val("rs63"),
    pros: contrib.slice(0, 3).map((x) => x.name), cons: contrib.slice(-2).filter((x) => x.c < 0).reverse().map((x) => x.name),
    why: r.plan.why || [],
  };
}
const toPick = (r) => ({
  sym: r.it.sym, name: names[r.it.sym], h: r.plan.horizon, action: r.plan.action, actionLabel: r.plan.actionLabel,
  pUp: r.plan.pUp, expPct: r.plan.expPct, start: r.plan.start, zoneLo: r.plan.zoneLo, zoneHi: r.plan.zoneHi,
  stop: r.plan.stop, target: r.plan.target, rr: r.plan.rr, pTarget: r.plan.pTarget, holdDays: r.plan.holdDays,
  reviewDate: r.plan.reviewDate, validUntil: r.plan.validUntil, cur: r.cur, expectancy: r.plan.expectancy,
  price: r.it.close[r.i], chg: pct(r.it.close[r.i], r.it.close[r.i - 1]), sizePct: r.plan.sizePct, riskPct: r.plan.riskPct, gainPct: r.plan.gainPct,
  ...details(r),
});
const picks = rows.filter((r) => active.has(r.plan.action) && (r.plan.expectancy ?? 0) > 0)
  .sort((a, b) => b.rank - a.rank).slice(0, config.maxPicks || 5).map(toPick);
const avoid = rows.filter((r) => r.plan.action === "EVITER").sort((a, b) => a.rank - b.rank).slice(0, config.maxAvoid || 3).map(toPick);
const watch = (config.watchlist || []).map((s) => rows.find((r) => r.it.sym === s)).filter(Boolean).map(toPick);
// plus forts mouvements de la derniere seance dans l'univers suivi
const moves = rows.map((r) => ({ sym: r.it.sym, name: names[r.it.sym], chg: pct(r.it.close[r.i], r.it.close[r.i - 1]) })).filter((m) => Number.isFinite(m.chg)).sort((a, b) => b.chg - a.chg);
const movers = { up: moves.slice(0, 3), down: moves.slice(-3).reverse() };
const pickSet = new Set(picks.map((p) => p.sym + "|" + p.h));

// une ligne de journal par valeur et par horizon (dedoublonnee si relance le meme jour)
const have = new Set(journal.pending.map((e) => `${e.sym}|${e.h}|${e.t}`));
for (const r of rows) {
  const t = r.it.time[r.i];
  for (const h of HORIZON_KEYS) {
    const key = `${r.it.sym}|${h}|${t}`;
    if (have.has(key)) continue;
    journal.pending.push({ sym: r.it.sym, name: names[r.it.sym], h, t, d: dShort, p: Math.round(r.evals[h].pUp * 1e4) / 1e4, pick: pickSet.has(r.it.sym + "|" + h) });
  }
}
journal.since ||= iso;

const indices = INDEX_DEFS.filter((d) => !d.list && bySym[d.symbol]).map((d) => {
  const it = bySym[d.symbol];
  const { i, evals } = evalOf(it);
  const s200 = ta.last(ta.sma(it.close, 200));
  return {
    id: d.id, label: d.label, price: it.close[i], chg: (it.close[i] / it.close[i - 1] - 1) * 100,
    p1S: evals["1S"].pUp, p1M: evals["1M"].pUp, trend: it.close[i] > s200 ? "au-dessus SMA 200" : "sous SMA 200",
    w1: pct(it.close[i], it.close[i - 5]), m1: pct(it.close[i], it.close[i - 21]),
  };
});

// ---------------------------------------------------------------------------
// 5. Bilan et fichiers publies pour l'app
// ---------------------------------------------------------------------------
const byHorizon = {};
for (const h of HORIZON_KEYS) {
  const s = journal.stats[h];
  if (s) byHorizon[h] = { n: s.n, hit: s.hit, nConf: s.nConf, hitConf: s.hitConf, brier: s.n ? s.brier / s.n : null };
}
let picksSummary = null;
if (journal.picks.length) {
  const n = journal.picks.length;
  const avg = journal.picks.reduce((a, p) => a + p.ret, 0) / n;
  let bs = 0, bn = 0;
  for (const p of journal.picks) { const b = journal.bench[p.h]; if (b?.n) { bs += b.sum / b.n; bn++; } }
  picksSummary = { n, avg, winRate: journal.picks.filter((p) => p.ret > 0).length / n, benchAvg: bn ? bs / bn : null };
}
const track = {
  updatedAt: today.toISOString(), since: journal.since ? `${journal.since.slice(8, 10)}/${journal.since.slice(5, 7)}/${journal.since.slice(0, 4)}` : null,
  byHorizon: Object.keys(byHorizon).length ? byHorizon : null, pending: journal.pending.length,
  picks: journal.picks.slice(0, 30), picksSummary, changes: journal.changes.slice(0, 20),
};

const dateLabel = today.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });
// ---------------------------------------------------------------------------
// 6. Contexte du jour : agenda, resultats, marches, actualites
// ---------------------------------------------------------------------------
const CONTEXT = [
  ["^VIX", "VIX (peur à Wall Street)"], ["^STOXX50E", "Euro Stoxx 50"], ["EURUSD=X", "Euro / dollar"],
  ["BZ=F", "Pétrole Brent"], ["GC=F", "Or"], ["^TNX", "Taux US 10 ans"], ["BTC-USD", "Bitcoin"],
];
let agenda = { today: [], tomorrow: [] }, fundamentals = {}, context = [], marketNews = [], earnings = { today: [], week: [] };
if (!FAKE) {
  const pday = parisDay();
  [agenda, fundamentals] = await Promise.all([fetchAgenda(pday), fetchFundamentals(stocks)]);
  log(`agenda : ${agenda.ok ? agenda.today.length + " annonces aujourd'hui" : "indisponible (" + agenda.error + ")"} | donnees de fond : ${fundamentals.__error ? "indisponibles (" + fundamentals.__error + ")" : Object.keys(fundamentals).length + " valeurs"}`);
  for (const [sym, label] of CONTEXT) {
    try {
      const c = await fetchCandles(sym, "3mo");
      const n = c.close.length - 1;
      context.push({ sym, label, last: c.close[n], chg: pct(c.close[n], c.close[n - 1]), m1: pct(c.close[n], c.close[Math.max(0, n - 21)]) });
    } catch (e) { /* source facultative */ }
  }
  // resultats d'entreprises de l'univers suivi
  const now = Date.now();
  for (const s of stocks) {
    const f = fundamentals[s];
    if (!f || !f.earnings) continue;
    const e = { sym: s, name: names[s], date: f.earnings, estimate: f.earningsEstimate };
    const ed = parisDay(new Date(f.earnings));
    if (ed === pday) earnings.today.push(e);
    else if (ed > pday && f.earnings <= now + 7 * 86400e3) earnings.week.push(e);
  }
  if (fundamentals.__error) {
    const us = new Set(stocks.filter((s) => !s.includes(".")));
    for (const r of await fetchNasdaqEarnings(pday)) if (us.has(r.sym)) earnings.today.push({ sym: r.sym, name: names[r.sym], when: r.when });
  }
  earnings.week.sort((a, b) => a.date - b.date);
  // fond + alerte resultats sur les selections
  for (const p of [...picks, ...avoid, ...watch]) {
    const f = fundamentals[p.sym];
    if (!f) continue;
    p.fund = { pe: f.pe, fpe: f.fpe, yield: f.yield, rating: f.rating, target: f.target, hi52: f.hi52, lo52: f.lo52 };
    if (f.earnings && f.earnings > Date.now() && p.reviewDate && f.earnings <= new Date(p.reviewDate).getTime()) {
      p.earningsWarning = `Résultats prévus le ${new Date(f.earnings).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })}${f.earningsEstimate ? " (date estimée)" : ""} : risque de forte variation pendant la position.`;
    }
  }
  // actualites
  const qs = ["Bourse de Paris CAC 40", "Wall Street Bourse", "BCE OR Fed taux d'intérêt", "pétrole OR dollar marchés"];
  marketNews = dedupeNews((await Promise.all(qs.map((q) => fetchNews(q, 4)))).flat()).sort((a, b) => (b.time || 0) - (a.time || 0)).slice(0, 8);
  for (const p of [...picks, ...watch]) p.news = await fetchNews((NEWS_NAMES[p.sym] || p.name) + " action", 2);
}
const vix = context.find((c) => c.sym === "^VIX");
const mood = !vix ? null : vix.last < 15 ? "calme" : vix.last < 20 ? "normal" : vix.last < 30 ? "nerveux" : "en stress";
const brief = [];
if (vix) brief.push(`Climat de marché ${mood} (VIX ${vix.last.toFixed(1).replace(".", ",")}${vix.chg != null ? ", " + (vix.chg >= 0 ? "+" : "") + vix.chg.toFixed(1).replace(".", ",") + " % la veille" : ""}).`);
const hi = agenda.today.filter((e) => e.impact === "fort");
if (hi.length) brief.push(`${hi.length} annonce(s) à fort impact aujourd'hui, la première à ${hi[0].time} (${hi[0].title}, ${hi[0].country}) : volatilité possible autour de ces horaires.`);
else if (agenda.ok) brief.push("Pas d'annonce macroéconomique majeure aujourd'hui.");
if (earnings.today.length) brief.push(`Résultats aujourd'hui : ${earnings.today.map((e) => e.name).join(", ")}.`);
const upIdx = indices.filter((x) => x.p1M >= 0.53).length, dnIdx = indices.filter((x) => x.p1M <= 0.47).length;
brief.push(upIdx > dnIdx ? `Les indices penchent légèrement à la hausse à 1 mois (${upIdx} sur ${indices.length}).` : dnIdx > upIdx ? `Les indices penchent à la baisse à 1 mois (${dnIdx} sur ${indices.length}).` : "Pas de tendance nette des indices à 1 mois.");
brief.push(picks.length ? `${picks.length} opportunité(s) retenue(s), surtout sur ${[...new Set(picks.map((p) => p.h))].map((h) => ({ "1J": "1 jour", "1S": "1 semaine", "1M": "1 mois", "3M": "3 mois" })[h]).join(" / ")}.` : "Aucune opportunité suffisamment solide aujourd'hui.");

const signals = { date: iso, dateLabel, picks, avoid, indices, brief, agenda, earnings, context, movers, news: marketNews };

// ---------------------------------------------------------------------------
// 7. Newsletter
// ---------------------------------------------------------------------------
const letter = buildLetter({ dateLabel, brief, indices, picks, avoid, watch, track, modelInfo: model, news: marketNews, agenda, earnings, context, movers, failed: Object.keys(failed) });
fs.writeFileSync(path.join(OUT, "newsletter.html"), letter.html);
fs.writeFileSync(path.join(OUT, "newsletter.txt"), letter.whatsapp);

const day = new Date().toLocaleDateString("en-GB", { weekday: "short", timeZone: "Europe/Paris" });
const weekday = !["Sat", "Sun"].includes(day);
model.newsletter = { lastSent: champion?.newsletter?.lastSent || null, channels: channelsConfigured() };
// diagnostic : indique seulement si chaque reglage est present (jamais sa valeur)
const DIAG_KEYS = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "MAIL_TO", "BREVO_API_KEY", "CALLMEBOT_PHONE", "CALLMEBOT_APIKEY"];
model.newsletter.diag = Object.fromEntries(DIAG_KEYS.map((k) => [k, (process.env[k] || "").trim() ? "present" : "absent"]));
model.newsletter.diag.event = process.env.GITHUB_EVENT_NAME || "local";
log("reglages d'envoi :", JSON.stringify(model.newsletter.diag));
if (NO_SEND) log("envoi desactive (--no-send) : apercu dans server/out/newsletter.html");
else if (!weekday && !FORCE_SEND) log("week-end : pas d'envoi");
else if (!channelsConfigured().length) {
  log("AUCUN CANAL CONFIGURE : les secrets SMTP_HOST et MAIL_TO (ou BREVO_API_KEY) sont vides pour cette execution.");
  if (FORCE_SEND) process.exitCode = 3;   // lancement manuel : on rend l'echec visible (croix rouge)
}
else {
  const res = await sendAll({ subject: `Quantum Algo – ${dateLabel}`, ...letter });
  log("envoye :", res.done.join(", ") || "rien", res.errors.length ? "| erreurs : " + res.errors.join(" ; ") : "");
  if (res.done.length) model.newsletter.lastSent = today.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });
  if (res.errors.length && !res.done.length) process.exitCode = 2;
}

writeJson("model.json", model);
writeJson("track.json", track);
writeJson("signals.json", signals);
writeJson("journal.json", journal, true);
log("termine.");
