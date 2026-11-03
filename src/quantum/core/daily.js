// Plan du jour : scenarios conditionnels pour la seance (pas une prevision).
// Le modele n'a pas d'avantage mesure a 1 jour (environ 50 % de bonnes directions),
// d'ou des regles "si le cours fait ceci -> faire cela" a partir de la seance precedente.
// Utilise par l'appli (cours en direct) et par le serveur (calcul du matin).
import * as ta from "./ta.js";

function ok(v) { return v != null && isFinite(v); }
function r2(v) { return ok(v) ? Math.round(v * 100) / 100 : null; }
function fr(v) { return ok(v) ? Number(v).toFixed(v >= 1000 ? 0 : 2).replace(".", ",") : "-"; }

/**
 * c : bougies { close, high, low, open?, time? }
 * opts.live : cours en direct (appli, seance ouverte) : la derniere bougie est alors la seance du jour
 * opts.earnings : date des resultats (ms ou ISO)
 * opts.news : [{ time (ms), tone: "positif" | "négatif" | "neutre" }]
 */
export function dayPlan(c, opts) {
  opts = opts || {};
  var C = c.close, H = c.high, L = c.low;
  if (!C || C.length < 30) return null;
  var live = ok(opts.live) ? opts.live : null;
  // seance de reference : la derniere seance terminee
  var j = live != null && opts.sessionOpen ? C.length - 2 : C.length - 1;
  if (j < 20) return null;
  var ph = H[j], pl = L[j], pc = C[j];
  var P = (ph + pl + pc) / 3;
  var R1 = 2 * P - pl, S1 = 2 * P - ph, R2 = P + (ph - pl), S2 = P - (ph - pl);
  var atrA = ta.atr(H.slice(0, j + 1), L.slice(0, j + 1), C.slice(0, j + 1), 14);
  var atr = atrA[atrA.length - 1];
  var sma50 = ta.sma(C.slice(0, j + 1), 50); sma50 = sma50[sma50.length - 1];
  // seuils serres : le plus proche entre le plus haut de la veille et R1 (meme chose cote bas)
  var upT = Math.min(ph, R1), dnT = Math.max(pl, S1);
  if (upT - dnT < 0.25 * atr) { var mid = (upT + dnT) / 2; upT = mid + 0.15 * atr; dnT = mid - 0.15 * atr; }
  var upStop = Math.max(P, upT - 0.6 * atr), dnStop = Math.min(P, dnT + 0.6 * atr);
  var upTgt = Math.max(R2, upT + 1.5 * (upT - upStop)), dnTgt = Math.min(S2, dnT - 1.5 * (dnStop - dnT));
  var trendUp = ok(sma50) ? pc >= sma50 : null;
  var res = {
    ref: { high: r2(ph), low: r2(pl), close: r2(pc) },
    pivot: r2(P), r1: r2(R1), r2: r2(R2), s1: r2(S1), s2: r2(S2), atr: r2(atr),
    range: { lo: r2(pc - 0.75 * atr), hi: r2(pc + 0.75 * atr) },
    up: { trigger: r2(upT), stop: r2(upStop), target: r2(upTgt) },
    down: { trigger: r2(dnT), stop: r2(dnStop), target: r2(dnTgt) },
    trendUp: trendUp,
    state: null, now: null, alerts: [],
  };
  res.up.text = "Si le cours dépasse " + fr(upT) + " en séance : achat possible, stop " + fr(upStop) + ", objectif " + fr(upTgt) + "." + (trendUp === false ? " Contre la tendance de fond : taille réduite." : "");
  res.down.text = "S'il passe sous " + fr(dnT) + " : pas d'achat, et sortie si tu détiens (objectif bas " + fr(dnTgt) + ", invalidé au-dessus de " + fr(dnStop) + ")." + (trendUp === true ? " Contre la tendance de fond : souvent un simple repli." : "");
  res.flat = "Entre " + fr(dnT) + " et " + fr(upT) + " : rien à faire, c'est du bruit.";
  if (live != null) {
    res.now = r2(live);
    res.state = live >= upT ? "up" : live <= dnT ? "down" : "flat";
  }
  // alertes evenement
  if (opts.earnings) {
    var em = typeof opts.earnings === "number" ? opts.earnings : Date.parse(opts.earnings);
    var days = (em - Date.now()) / 864e5;
    if (ok(em) && days > -1 && days <= 3) {
      var g = Math.max(1.5, Math.round((atr / pc) * 100 * 0.6 * 10) / 10);
      var when = new Date(em).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
      res.alerts.push({ kind: "earnings", level: "high", title: "Résultats " + (days < 0.5 ? "aujourd'hui" : "le " + when),
        rules: [
          "Le jour J, ne rien faire avant 10 h : laisse le marché digérer la publication.",
          "Ouverture en hausse de plus de " + String(g).replace(".", ",") + " % et cours qui tient au-dessus de " + fr(upT) + " à 10 h → bonne surprise confirmée : achat possible, stop " + fr(upStop) + ".",
          "Ouverture en baisse de plus de " + String(g).replace(".", ",") + " % ou cours sous " + fr(dnT) + " → déception : pas d'achat, sortie si tu détiens.",
          "Réaction faible (moins de " + String(g).replace(".", ",") + " %) → le marché attendait ces chiffres : on suit le plan habituel.",
        ] });
    }
  }
  if (opts.news && opts.news.length) {
    var recent = opts.news.filter(function (n) { return n.time && Date.now() - n.time < 36 * 3600e3; });
    var pos = recent.filter(function (n) { return n.tone === "positif"; }).length, neg = recent.filter(function (n) { return n.tone === "négatif"; }).length;
    if (recent.length >= 3 || pos + neg >= 2) {
      var tone = pos > neg ? "plutôt positive" : neg > pos ? "plutôt négative" : "partagée";
      res.alerts.push({ kind: "news", level: "mid", title: "Actualité chargée (" + recent.length + " articles, tonalité " + tone + ")",
        rules: [
          "Une grosse actu crée un écart à l'ouverture : regarde où le cours se situe à 10 h.",
          "Au-dessus de " + fr(upT) + " → le marché valide la nouvelle : achat possible, stop " + fr(upStop) + ".",
          "Sous " + fr(dnT) + " → le marché la sanctionne : pas d'achat.",
        ] });
    }
  }
  return res;
}
