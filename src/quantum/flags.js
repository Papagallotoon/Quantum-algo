// Drapeau du marche de cotation d'une valeur ou d'un indice (symboles Yahoo).
var SUFFIX = { PA: "🇫🇷", DE: "🇩🇪", F: "🇩🇪", MI: "🇮🇹", T: "🇯🇵", AS: "🇳🇱", L: "🇬🇧", SW: "🇨🇭", MC: "🇪🇸", BR: "🇧🇪", LS: "🇵🇹", HK: "🇭🇰", TO: "🇨🇦" };
var SPECIAL = {
  "^FCHI": "🇫🇷", "^SBF120": "🇫🇷", "^GSPC": "🇺🇸", "^NDX": "🇺🇸", "^IXIC": "🇺🇸", "^DJI": "🇺🇸", "^VIX": "🇺🇸", "^TNX": "🇺🇸",
  "^GDAXI": "🇩🇪", "FTSEMIB.MI": "🇮🇹", "^N225": "🇯🇵", "^STOXX50E": "🇪🇺", "EURUSD=X": "🇪🇺",
};
var INDEX_ID = { cac: "🇫🇷", sbf: "🇫🇷", srd: "🇫🇷", spx: "🇺🇸", ndx: "🇺🇸", dji: "🇺🇸", dax: "🇩🇪", mib: "🇮🇹", nkx: "🇯🇵" };

export function flagOf(sym) {
  if (!sym) return "";
  var s = String(sym);
  if (SPECIAL[s]) return SPECIAL[s];
  if (INDEX_ID[s]) return INDEX_ID[s];
  if (s.charAt(0) === "^" || /=F$|=X$|-USD$/.test(s)) return "";
  var m = /\.([A-Z]{1,3})$/.exec(s);
  if (m) return SUFFIX[m[1]] || "";
  return "🇺🇸";
}
