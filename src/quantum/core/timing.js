// Timing des signaux : depuis quand le signal existe, combien le cours a deja monte,
// et un radar de "departs" (signaux rapides) mesure sur l'historique.
// Le modele principal suit surtout des tendances lentes (moyenne 200 jours, plus haut 52 semaines) :
// il confirme une hausse deja engagee. Ces outils rendent ce retard visible et aident a arriver plus tot.
import * as ta from "./ta.js";
import { evaluate, sigmaAt, HORIZONS } from "./model.js";

var MIN_P = 0.53;
function ok(v) { return v != null && isFinite(v); }

/**
 * Age du signal d'achat sur l'horizon h : nombre de seances depuis que les chances
 * de hausse ont depasse le seuil, et variation du cours depuis.
 * Retourne { age, since (timestamp), gainPct, stage: "frais" | "en cours" | "tardif", factor }
 */
export function signalAge(all, c, i, h, model, expPct) {
  var C = c.close, start = null;
  for (var k = i; k >= Math.max(1, i - 60); k--) {
    var ev = evaluate(all, k, h, model, sigmaAt(C, k, 60));
    if (!ev || !(ev.pUp >= MIN_P)) break;
    start = k;
  }
  if (start == null) return null;
  var atrA = ta.atr(c.high, c.low, C, 14), atrPct = atrA[i] / C[i] * 100;
  var gain = (C[i] / C[start] - 1) * 100, age = i - start;
  var exp = Math.max(1, Math.abs(expPct || 0));
  // tardif : une bonne partie du gain attendu est deja faite, ou plus de 2,5 ATR de hausse
  var stage = gain > Math.max(exp, 2.5 * atrPct) ? "tardif" : (age <= 3 || gain < 0.5 * exp) ? "frais" : "en cours";
  return {
    age: age, since: c.time ? c.time[start] : null, gainPct: Math.round(gain * 100) / 100, stage: stage,
    factor: stage === "frais" ? 1 : stage === "en cours" ? 0.85 : 0.6,
  };
}

// Regle "ca demarre" : cassure du plus haut 20 jours, moyenne 8 jours qui vient de passer
// au-dessus de la moyenne 21 jours (moins de 4 seances), volume au-dessus de la normale.
function prep(c) {
  var C = c.close;
  return {
    C: C, H: c.high, V: c.volume || [],
    e8: ta.ema(C, 8), e21: ta.ema(C, 21), atr: ta.atr(c.high, c.low, C, 14),
  };
}
function fires(p, t) {
  if (t < 30) return false;
  var hi = -Infinity, vs = 0, vn = 0;
  for (var k = t - 20; k < t; k++) { if (p.H[k] > hi) hi = p.H[k]; if (p.V[k] > 0) { vs += p.V[k]; vn++; } }
  if (!(p.C[t] > hi)) return false;
  if (!(p.e8[t] > p.e21[t])) return false;
  var fresh = false;
  for (var j = 1; j <= 4; j++) if (p.e8[t - j] <= p.e21[t - j]) { fresh = true; break; }
  if (!fresh) return false;
  var vavg = vn ? vs / vn : 0;
  return vavg > 0 ? p.V[t] > 1.3 * vavg : true;
}

/**
 * Radar : valeurs ou la regle se declenche aujourd'hui (ou hier),
 * et statistiques de la regle sur tout l'historique de l'univers (hausse a 1 semaine et 1 mois).
 * items : [{ sym, c }]
 */
export function radar(items) {
  var st = { n: 0, up5: 0, up21: 0, sum5: 0, sum21: 0, base: 0, baseUp: 0, baseSum: 0 };
  var hits = [];
  items.forEach(function (it) {
    var c = it.c, p = prep(c), n = c.close.length, i = n - 1;
    for (var t = 30; t < n - 21; t++) {
      var r21 = (p.C[t + 21] / p.C[t] - 1) * 100;
      st.base++; st.baseSum += r21; if (r21 > 0) st.baseUp++;
      if (!fires(p, t)) continue;
      var r5 = (p.C[t + 5] / p.C[t] - 1) * 100;
      st.n++; st.sum5 += r5; st.sum21 += r21; if (r5 > 0) st.up5++; if (r21 > 0) st.up21++;
    }
    for (var d = 0; d <= 1; d++) {
      if (fires(p, i - d)) {
        var vs = 0, vn = 0; for (var k = i - d - 20; k < i - d; k++) if (p.V[k] > 0) { vs += p.V[k]; vn++; }
        hits.push({ sym: it.sym, day: d, chg: (p.C[i] / p.C[i - 1] - 1) * 100, gain20: (p.C[i] / p.C[Math.max(0, i - 20)] - 1) * 100,
          vol: vn && p.V[i - d] ? p.V[i - d] / (vs / vn) : null, trigger: p.C[i - d] });
        break;
      }
    }
  });
  var r = function (v) { return Math.round(v * 10) / 10; };
  var stats = st.n ? {
    n: st.n, up5: r(st.up5 / st.n * 100), up21: r(st.up21 / st.n * 100), avg5: r(st.sum5 / st.n), avg21: r(st.sum21 / st.n),
    baseUp21: r(st.baseUp / st.base * 100), baseAvg21: r(st.baseSum / st.base),
  } : null;
  hits.sort(function (a, b) { return a.day - b.day || (b.vol || 0) - (a.vol || 0); });
  return { stats: stats, hits: hits };
}
