// Resume "en bref" (technique + fondamental + modele + que faire), meme moteur que le site.
/* eslint-disable */
// ---------- resume "en bref" : technique + fondamental + modele + verdict ----------
// x = { name, isIndex, price, hl (libelle horizon), p, perf:{m1,m3,y1}, sma50, sma200, rsi,
//       fam:[[famille, poids]], action, plan:{zoneLo,zoneHi,stop,target}, fund:{pe,fpe,yield,rating,hi52,lo52},
//       earnings (ms), breadth:{up,down,n}, cur }
var BF_FAM = { Tendance: "la tendance", Momentum: "l'élan récent (momentum)", Volume: "les volumes", Structure: "la structure du graphique", Volatilite: "la volatilité", Chandeliers: "les figures de chandeliers" };
function bfOk(v) { return v != null && isFinite(v); }
function bfN(v, d) { return Number(v).toFixed(d == null ? 1 : d).replace(".", ","); }
function bfP(v) { return (v >= 0 ? "+" : "−") + bfN(Math.abs(v)) + " %"; }
function bfPx(v) { return bfOk(v) ? Number(v).toFixed(v >= 1000 ? 0 : 2).replace(".", ",") : "-"; }
// niveau habituel : a 3 mois les actions montent un peu plus souvent qu'elles ne baissent,
// donc on compare la probabilite a la mediane de toutes les valeurs, pas a 50 %
function bfBase(b) { return bfOk(b) ? b : 0.5; }
function qaSig(p, base) {
  if (!bfOk(p)) return 0;
  var d = p - bfBase(base);
  return p >= 0.53 && d >= 0.02 ? 1 : p <= 0.47 && d <= -0.02 ? -1 : 0;
}
function bfStrength(p, base) {
  var b = bfBase(base), d = p - b, ad = Math.abs(d);
  if (ad < 0.02) return b > 0.52 ? "c'est le niveau habituel à cet horizon (en moyenne " + Math.round(b * 100) + " % pour toutes les valeurs, car les actions montent un peu plus souvent qu'elles ne baissent) : pas de signal particulier" : "pas d'avantage net (≈ pile ou face)";
  var w = ad >= 0.08 ? "un avantage net" : ad >= 0.04 ? "un léger avantage" : "un très léger avantage";
  return w + (d > 0 ? " à la hausse" : " à la baisse") + (b > 0.52 ? " par rapport à la normale (" + Math.round(b * 100) + " %)" : "");
}
function qaVerdictLabel(p, base) {
  var g = qaSig(p, base), b = bfBase(base);
  if (!g) return b > 0.52 ? "Niveau habituel (≈ " + Math.round(b * 100) + " %)" : "Pile ou face";
  var d = Math.abs(p - b);
  return d >= 0.08 ? (g > 0 ? "Haussier" : "Baissier") : d >= 0.04 ? (g > 0 ? "Plutôt haussier" : "Plutôt baissier") : (g > 0 ? "Légèrement haussier" : "Légèrement baissier");
}
function qaBrief(x) {
  var out = { tech: null, fund: null, model: null, todo: null, warn: null };
  // technique
  var t = [];
  if (bfOk(x.sma200) && bfOk(x.price)) {
    var a200 = x.price >= x.sma200;
    var s = a200 ? "au-dessus de sa moyenne 200 j (tendance de fond haussière)" : "sous sa moyenne 200 j (tendance de fond baissière)";
    if (bfOk(x.sma50)) {
      if (a200 && x.price < x.sma50) s += ", mais en repli à court terme (sous la moyenne 50 j)";
      else if (!a200 && x.price > x.sma50) s += ", mais en rebond à court terme (au-dessus de la moyenne 50 j)";
    }
    t.push(s);
  }
  if (x.perf && bfOk(x.perf.m1) && bfOk(x.perf.m3)) t.push(bfP(x.perf.m1) + " sur 1 mois, " + bfP(x.perf.m3) + " sur 3 mois");
  if (bfOk(x.rsi)) t.push(x.rsi >= 70 ? "RSI " + Math.round(x.rsi) + " : surachat, une pause est fréquente" : x.rsi <= 30 ? "RSI " + Math.round(x.rsi) + " : survente, un rebond technique est possible" : "RSI " + Math.round(x.rsi) + " : ni surachat ni survente");
  if (t.length) out.tech = t.join(" ; ").replace(/^./, function (c) { return c.toUpperCase(); }) + ".";
  // fondamental (actions) ou composants (indices)
  if (x.isIndex && x.breadth && x.breadth.n) {
    var b = x.breadth;
    out.fund = !b.up && !b.down ? "Aucune des " + b.n + " valeurs ne se distingue sur " + x.hl + " : toutes sont au niveau habituel." : b.up + " valeur" + (b.up > 1 ? "s" : "") + " sur " + b.n + " penche" + (b.up > 1 ? "nt" : "") + " à la hausse sur " + x.hl + ", " + b.down + " à la baisse" + (b.up > b.down * 1.5 ? " : la majorité soutient l'indice." : b.down > b.up * 1.5 ? " : la majorité pèse sur l'indice." : " : avis partagés.");
  } else if (x.fund) {
    var f = x.fund, g = [];
    if (bfOk(f.pe) && bfOk(f.fpe) && f.pe > 0 && f.fpe > 0) {
      g.push(f.fpe < f.pe * 0.85 ? "bénéfices attendus en hausse (PER " + bfN(f.pe) + " → " + bfN(f.fpe) + " l'an prochain)" : f.fpe > f.pe * 1.15 ? "bénéfices attendus en baisse (PER " + bfN(f.pe) + " → " + bfN(f.fpe) + ")" : "bénéfices attendus stables (PER " + bfN(f.fpe) + ")");
      if (f.fpe < 11) g.push("valorisation modeste");
      else if (f.fpe > 30) g.push("valorisation exigeante");
    } else if (bfOk(f.pe) && f.pe > 0) g.push("PER " + bfN(f.pe));
    else if (bfOk(f.pe) && f.pe < 0) g.push("entreprise en perte");
    var rn = f.rating ? parseFloat(String(f.rating).replace(",", ".")) : NaN;
    if (bfOk(rn)) g.push(rn <= 1.8 ? "analystes très positifs" : rn <= 2.5 ? "analystes positifs" : rn <= 3.3 ? "analystes neutres" : "analystes négatifs");
    if (bfOk(f.yield) && f.yield >= 3) g.push("dividende " + bfN(f.yield) + " %");
    if (bfOk(f.hi52) && bfOk(x.price) && f.hi52 > 0) {
      var dh = (x.price / f.hi52 - 1) * 100;
      g.push(dh > -5 ? "proche de son plus haut annuel" : dh < -25 ? "à " + bfP(dh) + " de son plus haut annuel" : "");
    }
    g = g.filter(Boolean);
    if (g.length) out.fund = g.join(", ").replace(/^./, function (c) { return c.toUpperCase(); }) + ".";
  }
  // modele
  if (bfOk(x.p)) {
    var g = qaSig(x.p, x.base);
    var m = Math.round(x.p * 100) + " % de chances de hausse sur " + x.hl + " : " + bfStrength(x.p, x.base) + ".";
    if (g) {
      var fam = (x.fam || []).filter(function (q) { return Math.abs(q[1]) >= 3; }).slice().sort(function (q, r) { return r[1] - q[1]; });
      var pos = fam.filter(function (q) { return q[1] > 0; })[0], neg = fam.filter(function (q) { return q[1] < 0; }).slice(-1)[0];
      if (pos || neg) m += (pos ? " Soutient : " + (BF_FAM[pos[0]] || pos[0]) + "." : "") + (neg ? " Freine : " + (BF_FAM[neg[0]] || neg[0]) + "." : "");
      var past = x.perf && bfOk(x.perf.m3) ? x.perf.m3 : x.perf && bfOk(x.perf.m1) ? x.perf.m1 : null;
      if (past != null && ((past < -2 && g > 0) || (past > 2 && g < 0)))
        m += " Ce chiffre parle de l'avenir (" + x.hl + "), pas du passé : " + (past < 0 ? "malgré la baisse récente, le modèle voit un rebond plus probable que d'habitude." : "malgré la hausse récente, le modèle voit un essoufflement plus probable que d'habitude.");
    }
    out.model = m;
    out.sig = g;
  }
  // que faire
  var pl = x.plan || {}, cur = x.cur ? " " + x.cur : "";
  var A = {
    ENTRER: ["Entrer", "tendance haussière, indicateurs favorables et cours pas trop étiré" + (bfOk(pl.stop) ? ". Achat autour de " + bfPx(x.price) + cur + ", sortie si le cours passe sous " + bfPx(pl.stop) + ", objectif " + bfPx(pl.target) : "") + "."],
    ATTENDRE_REPLI: ["Attendre un repli", "le contexte est favorable mais le cours est monté trop vite" + (bfOk(pl.zoneLo) ? " ; ordre d'achat entre " + bfPx(pl.zoneLo) + " et " + bfPx(pl.zoneHi) : "") + "."],
    ATTENDRE_CONFIRMATION: ["Attendre", "la tendance de court terme n'a pas encore tourné à la hausse" + (bfOk(pl.zoneLo) ? " ; acheter seulement après une clôture au-dessus de " + bfPx(pl.zoneLo) : "") + "."],
    NEUTRE: ["Rester à l'écart", "l'avantage est trop faible pour couvrir les frais. Si tu la détiens, rien ne presse."],
    EVITER: ["Éviter / alléger", "le modèle penche à la baisse" + (bfOk(pl.stop) ? " ; si tu la détiens, protection possible sous " + bfPx(pl.stop) : "") + "."],
  };
  if (A[x.action]) out.todo = { word: A[x.action][0], text: A[x.action][1], action: x.action };
  if (x.earnings && x.earnings > Date.now() && x.earnings - Date.now() < 30 * 864e5)
    out.warn = "Résultats le " + new Date(x.earnings).toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) + " : le cours peut fortement bouger ce jour-là.";
  return out;
}

function sma(c, n) { if (!c || c.length < n) return NaN; var s = 0; for (var k = c.length - n; k < c.length; k++) s += c[k]; return s / n; }
function rsi14(c) {
  if (!c || c.length < 30) return NaN;
  var start = Math.max(1, c.length - 120), g = 0, l = 0, n = 14, k;
  for (k = start; k < start + n; k++) { var d0 = c[k] - c[k - 1]; if (d0 > 0) g += d0; else l -= d0; }
  g /= n; l /= n;
  for (k = start + n; k < c.length; k++) { var d = c[k] - c[k - 1]; g = (g * 13 + Math.max(d, 0)) / 14; l = (l * 13 + Math.max(-d, 0)) / 14; }
  return l === 0 ? 100 : 100 - 100 / (1 + g / l);
}
function chgN(c, n) { return c && c.length > n ? (c[c.length - 1] / c[c.length - 1 - n] - 1) * 100 : NaN; }

// x : actif construit par model/build (buildAsset), plan : planFor(), F : contenu de fund.json
export function briefForAsset(s, plan, F, opts) {
  opts = opts || {};
  var c = s && s._candles ? s._candles.close : null;
  var h = plan ? plan.horizon : opts.horizon;
  var p = plan && plan.evals && plan.evals[h] ? plan.evals[h].pUp : s.pUp;
  var f = F && F.f ? F.f[s.symbol || s.id] : null;
  return qaBrief({
    name: s.name, isIndex: !!opts.isIndex, price: s.priceRaw, cur: s.currency,
    hl: opts.hl || (plan && plan.horizonLabel) || h, p: p,
    base: F && F.base ? F.base[h] : null,
    perf: { m1: chgN(c, 21), m3: chgN(c, 63), y1: chgN(c, 252) },
    sma50: sma(c, 50), sma200: sma(c, 200), rsi: rsi14(c),
    fam: opts.fam || null, action: plan ? plan.action : null, plan: plan || null,
    fund: f ? { pe: f.pe, fpe: f.fpe, yield: f.yield, rating: f.rating, hi52: f.hi52, lo52: f.lo52 } : null,
    earnings: f && f.earn ? Date.parse(f.earn) : null,
    breadth: opts.breadth || null,
  });
}

export { qaBrief, qaSig, qaVerdictLabel };
