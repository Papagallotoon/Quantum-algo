// Generation du site public (GitHub Pages, dossier docs/ du depot).
// Le site est une seule page qui lit docs/data.json, regenere chaque matin.

import fs from "node:fs";
import path from "node:path";
import { rowsAt } from "../../src/quantum/core/signals.js";
import { votes, familyContrib, verdictOf, sigmaAt, HORIZON_KEYS, HORIZONS } from "../../src/quantum/core/model.js";
import { evaluateAll, buildPlan } from "../../src/quantum/core/plan.js";
import { simulate } from "../../src/quantum/core/montecarlo.js";
import { PROFILES } from "../../src/quantum/core/universe.js";

const r2 = (v) => (v == null || !Number.isFinite(v) ? null : Math.round(v * 100) / 100);
const r4 = (v) => (v == null || !Number.isFinite(v) ? null : Math.round(v * 1e4) / 1e4);
const pct = (a, b) => (b ? (a / b - 1) * 100 : null);

function assetData(it, model, extra) {
  const C = it.close, i = C.length - 1, c = it.c;
  const sg = sigmaAt(C, i, 60);
  const evals = evaluateAll(it.all, i, model, sg);
  const plan = buildPlan(c, evals, sg);
  const cur = c.currency || "";
  const ev = {}, mc = {};
  for (const h of HORIZON_KEYS) {
    ev[h] = { p: r4(evals[h].pUp), e: r2(evals[h].expPct), v: verdictOf(evals[h].pUp) };
    const m = simulate(C[i], sg, evals[h].muLog, HORIZONS[h], 3000);
    mc[h] = { lo: r2(m.p05), med: r2(m.median), hi: r2(m.p95) };
  }
  const hm = model.horizons[plan.horizon] || {};
  const yearStart = new Date(new Date().getUTCFullYear(), 0, 1).getTime() / 1000;
  let y0 = it.time.findIndex((t) => t >= yearStart); if (y0 < 1) y0 = 1;
  const prof = PROFILES[it.sym] || {};
  const p = plan;
  return {
    sym: it.sym, name: extra.name, cur, price: r2(C[i]), chg: r2(pct(C[i], C[i - 1])),
    sector: prof.sector || null, profile: prof.text || null, index: extra.index || null,
    perf: { w1: r2(pct(C[i], C[i - 5])), m1: r2(pct(C[i], C[i - 21])), m3: r2(pct(C[i], C[i - 63])), ytd: r2(pct(C[i], C[y0 - 1])), y1: r2(pct(C[i], C[Math.max(0, i - 252)])) },
    ev, mc,
    plan: {
      h: p.horizon, action: p.action, label: p.actionLabel, start: p.start || null,
      zoneLo: r2(p.zoneLo), zoneHi: r2(p.zoneHi), stop: r2(p.stop), target: r2(p.target), rr: r2(p.rr),
      pTarget: r4(p.pTarget), riskPct: r2(p.riskPct), gainPct: r2(p.gainPct), sizePct: r2(p.sizePct),
      hold: p.holdDays || HORIZONS[p.horizon], review: p.reviewDate ? new Date(p.reviewDate).toISOString().slice(0, 10) : null,
      valid: p.validUntil ? new Date(p.validUntil).toISOString().slice(0, 10) : null, why: p.why || [],
    },
    votes: votes(it.all, i),
    fam: familyContrib(it.all, i, hm),
    tech: rowsAt(it.all, i, cur).map((x) => [x.name, x.cat, x.val, x.sig]),
    hist: C.slice(-130).map(r2), dates: it.time.slice(-130),
    fund: extra.fund || null, earnings: extra.earnings || null, news: extra.news || null,
  };
}

export function buildSite({ subscribeApi, outDir, templateDir, items, bySym, indexDefs, components, names, model, signals, track, fundamentals, iso, dateLabel }) {
  fs.mkdirSync(outDir, { recursive: true });
  const indexOfSym = {};
  for (const d of indexDefs) for (const s of components[d.id] || []) (indexOfSym[s] ||= []).push(d.id);
  const newsBySym = {};
  for (const p of [...(signals.picks || []), ...(signals.watchNews || [])]) if (p.news) newsBySym[p.sym] = p.news;

  const stocks = {};
  for (const it of items) {
    const f = fundamentals?.[it.sym];
    stocks[it.sym] = assetData(it, model, {
      name: names[it.sym], index: indexOfSym[it.sym] || [],
      fund: f ? { pe: r2(f.pe), fpe: r2(f.fpe), yield: r2(f.yield), rating: f.rating, target: r2(f.target), hi52: r2(f.hi52), lo52: r2(f.lo52), cap: f.cap } : null,
      earnings: f?.earnings ? new Date(f.earnings).toISOString() : null,
      news: newsBySym[it.sym] || null,
    });
  }
  const indices = [];
  for (const d of indexDefs) {
    const it = bySym[d.symbol];
    const base = it ? assetData(it, model, { name: d.label }) : null;
    indices.push({
      id: d.id, label: d.label, name: d.name, place: d.place, note: d.note || null, ref: d.list ? "cac" : null,
      data: d.list ? null : base,
      members: (components[d.id] || []).filter((s) => stocks[s]),
    });
  }
  const horizonsInfo = Object.fromEntries(HORIZON_KEYS.map((h) => [h, model.horizons[h]?.oos || null]));
  const data = {
    date: iso, dateLabel, generatedAt: new Date().toISOString(), subscribeApi: subscribeApi || null,
    model: { version: model.version, source: model.source, summary: model.summary, oos: horizonsInfo, changes: track.changes || [] },
    today: { brief: signals.brief || [], agenda: signals.agenda || null, earnings: signals.earnings || null, context: signals.context || [], movers: signals.movers || null, news: signals.news || [], picks: (signals.picks || []).map((p) => p.sym), avoid: (signals.avoid || []).map((p) => p.sym) },
    track, indices, stocks,
  };
  fs.writeFileSync(path.join(outDir, "data.json"), JSON.stringify(data));
  fs.copyFileSync(path.join(templateDir, "index.html"), path.join(outDir, "index.html"));
  if (fs.existsSync(path.join(templateDir, "learn.json"))) fs.copyFileSync(path.join(templateDir, "learn.json"), path.join(outDir, "learn.json"));
  fs.writeFileSync(path.join(outDir, ".nojekyll"), "");
  return data;
}
