// Informations complementaires pour la lettre du matin :
//  - agenda economique du jour (calendrier ForexFactory, gratuit, sans cle)
//  - donnees de fond Yahoo (PER, rendement, avis des analystes, date de resultats)
//  - resultats d'entreprises du jour (Yahoo, a defaut Nasdaq pour les valeurs US)
//  - actualites avec tonalite (Google Actualites)
// Chaque source est facultative : si elle ne repond pas, la lettre part sans elle.

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const TZ = "Europe/Paris";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, headers = {}, timeoutMs = 15000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json", ...headers }, signal: ctl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally { clearTimeout(t); }
}

export function parisDay(d = new Date()) {
  return d.toLocaleDateString("en-CA", { timeZone: TZ }); // AAAA-MM-JJ
}
export function parisTime(d) {
  return d.toLocaleTimeString("fr-FR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
}

// ---------------------------------------------------------------------------
// Agenda economique
// ---------------------------------------------------------------------------
const COUNTRY = { USD: "Etats-Unis", EUR: "Zone euro", GBP: "Royaume-Uni", JPY: "Japon", CNY: "Chine", CHF: "Suisse", CAD: "Canada", AUD: "Australie" };
const FLAG = { USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", JPY: "🇯🇵", CNY: "🇨🇳", CHF: "🇨🇭", CAD: "🇨🇦", AUD: "🇦🇺" };

// traductions des annonces les plus suivies (le reste garde son nom anglais)
const TR = [
  [/^Non-Farm Employment Change/i, "Créations d'emplois non agricoles (NFP)"],
  [/^Unemployment Rate/i, "Taux de chômage"],
  [/^Unemployment Claims/i, "Inscriptions hebdomadaires au chômage"],
  [/^Average Hourly Earnings/i, "Salaire horaire moyen"],
  [/^Core CPI/i, "Inflation sous-jacente (CPI hors énergie et alimentation)"],
  [/^CPI Flash Estimate/i, "Inflation (estimation flash)"],
  [/^CPI/i, "Inflation (indice des prix à la consommation)"],
  [/^Core PCE Price Index/i, "Inflation PCE sous-jacente (indicateur préféré de la Fed)"],
  [/^Core PPI|^PPI/i, "Prix à la production"],
  [/^Federal Funds Rate/i, "Décision de taux de la Fed"],
  [/^FOMC Statement/i, "Communiqué de la Fed"],
  [/^FOMC Press Conference/i, "Conférence de presse de la Fed"],
  [/^FOMC Meeting Minutes/i, "Compte rendu de la dernière réunion de la Fed"],
  [/^Fed Chair .* Speaks/i, "Discours du président de la Fed"],
  [/^Main Refinancing Rate/i, "Décision de taux de la BCE"],
  [/^Monetary Policy Statement/i, "Communiqué de politique monétaire"],
  [/^ECB Press Conference/i, "Conférence de presse de la BCE"],
  [/^ECB President .* Speaks/i, "Discours de la présidente de la BCE"],
  [/^Official Bank Rate/i, "Décision de taux de la Banque d'Angleterre"],
  [/^BOJ Policy Rate/i, "Décision de taux de la Banque du Japon"],
  [/^Advance GDP|^Prelim GDP|^Final GDP|^GDP/i, "Croissance du PIB"],
  [/^Core Retail Sales/i, "Ventes au détail hors automobile"],
  [/^Retail Sales/i, "Ventes au détail"],
  [/^ISM Manufacturing PMI/i, "Indice ISM manufacturier"],
  [/^ISM Services PMI/i, "Indice ISM des services"],
  [/^Flash Manufacturing PMI/i, "PMI manufacturier (flash)"],
  [/^Flash Services PMI/i, "PMI des services (flash)"],
  [/Manufacturing PMI/i, "PMI manufacturier"],
  [/Services PMI/i, "PMI des services"],
  [/^JOLTS Job Openings/i, "Offres d'emploi JOLTS"],
  [/^ADP Non-Farm Employment Change/i, "Emplois privés ADP"],
  [/^CB Consumer Confidence/i, "Confiance des consommateurs (Conference Board)"],
  [/^Prelim UoM Consumer Sentiment|UoM Consumer Sentiment/i, "Moral des ménages (Université du Michigan)"],
  [/^German ifo Business Climate/i, "Climat des affaires allemand (Ifo)"],
  [/^German ZEW Economic Sentiment|ZEW Economic Sentiment/i, "Sentiment économique ZEW"],
  [/^Crude Oil Inventories/i, "Stocks de pétrole brut (EIA)"],
  [/^Durable Goods Orders/i, "Commandes de biens durables"],
  [/^Core Durable Goods Orders/i, "Commandes de biens durables hors transport"],
  [/^Pending Home Sales/i, "Promesses de ventes de logements"],
  [/^Existing Home Sales/i, "Ventes de logements anciens"],
  [/^New Home Sales/i, "Ventes de logements neufs"],
  [/^Building Permits/i, "Permis de construire"],
  [/^Trade Balance/i, "Balance commerciale"],
  [/^Industrial Production/i, "Production industrielle"],
  [/^Bank Holiday/i, "Jour férié (marché fermé ou réduit)"],
];
function frTitle(t) {
  for (const [re, fr] of TR) if (re.test(t)) return fr + (/m\/m/i.test(t) ? " (sur un mois)" : /y\/y/i.test(t) ? " (sur un an)" : /q\/q/i.test(t) ? " (sur un trimestre)" : "");
  return t;
}

export async function fetchAgenda(day = parisDay()) {
  const out = { today: [], tomorrow: [], ok: false };
  try {
    const rows = await getJson("https://nfs.faireconomy.media/ff_calendar_thisweek.json");
    const tomorrowD = new Date(new Date(day + "T12:00:00Z").getTime() + 86400000);
    const tomorrow = parisDay(tomorrowD);
    for (const r of rows) {
      if (!COUNTRY[r.country]) continue;
      if (r.impact !== "High" && r.impact !== "Medium" && r.impact !== "Holiday") continue;
      const d = new Date(r.date);
      const dd = parisDay(d);
      const ev = {
        time: /T00:00:00/.test(r.date) && r.impact === "Holiday" ? "toute la journée" : parisTime(d),
        ts: d.getTime(),
        cur: r.country, country: COUNTRY[r.country], flag: FLAG[r.country] || "",
        title: frTitle(r.title), original: r.title,
        impact: r.impact === "High" ? "fort" : r.impact === "Holiday" ? "férié" : "moyen",
        forecast: r.forecast || "", previous: r.previous || "",
      };
      if (dd === day) out.today.push(ev);
      else if (dd === tomorrow && r.impact === "High") out.tomorrow.push(ev);
    }
    out.today.sort((a, b) => a.ts - b.ts);
    out.tomorrow.sort((a, b) => a.ts - b.ts);
    out.ok = true;
  } catch (e) {
    out.error = e.message;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Donnees de fond Yahoo (necessite un "crumb", comme le site Yahoo lui-meme)
// ---------------------------------------------------------------------------
async function yahooCrumb() {
  const r1 = await fetch("https://fc.yahoo.com", { headers: { "User-Agent": UA }, redirect: "manual" }).catch(() => null);
  const cookies = r1 && r1.headers.getSetCookie ? r1.headers.getSetCookie() : [];
  const cookie = cookies.map((c) => c.split(";")[0]).join("; ");
  if (!cookie) throw new Error("pas de cookie Yahoo");
  const r2 = await fetch("https://query2.finance.yahoo.com/v1/test/getcrumb", { headers: { "User-Agent": UA, Cookie: cookie } });
  const crumb = (await r2.text()).trim();
  if (!r2.ok || !crumb || crumb.length > 40 || /\s|</.test(crumb)) throw new Error("crumb Yahoo indisponible");
  return { cookie, crumb };
}

export async function fetchFundamentals(symbols) {
  const info = {};
  try {
    const { cookie, crumb } = await yahooCrumb();
    for (let i = 0; i < symbols.length; i += 40) {
      const chunk = symbols.slice(i, i + 40);
      const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(chunk.join(","))}&crumb=${encodeURIComponent(crumb)}`;
      const json = await getJson(url, { Cookie: cookie });
      for (const q of json?.quoteResponse?.result || []) {
        const e = q.earningsTimestamp || q.earningsTimestampStart;
        info[q.symbol] = {
          name: q.longName || q.shortName,
          pe: q.trailingPE ?? null,
          fpe: q.forwardPE ?? null,
          yield: q.dividendYield != null ? q.dividendYield : q.trailingAnnualDividendYield != null ? q.trailingAnnualDividendYield * 100 : null,
          rating: q.averageAnalystRating || null,         // ex. "2.1 - Buy"
          target: q.targetMeanPrice ?? null,
          cap: q.marketCap ?? null,
          hi52: q.fiftyTwoWeekHigh ?? null, lo52: q.fiftyTwoWeekLow ?? null,
          earnings: e ? e * 1000 : null,
          earningsEstimate: !!(q.isEarningsDateEstimate),
          exDiv: q.exDividendDate ? q.exDividendDate * 1000 : null,
        };
      }
      await sleep(300);
    }
  } catch (e) {
    info.__error = e.message;
  }
  return info;
}

// Resultats publies aujourd'hui par des societes US (complement si Yahoo ne repond pas)
export async function fetchNasdaqEarnings(day = parisDay()) {
  try {
    const json = await getJson(`https://api.nasdaq.com/api/calendar/earnings?date=${day}`, { Origin: "https://www.nasdaq.com", Referer: "https://www.nasdaq.com/" });
    return (json?.data?.rows || []).map((r) => ({ sym: r.symbol, name: r.name, when: r.time === "time-pre-market" ? "avant l'ouverture" : r.time === "time-after-hours" ? "après la clôture" : "", cap: r.marketCap }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Actualites avec tonalite
// ---------------------------------------------------------------------------
const POS = ["hausse", "bondit", "grimpe", "s'envole", "progresse", "record", "relève", "rehausse", "dépasse", "solide", "rebond", "accord", "contrat", "acquisition", "croissance", "bénéfice en hausse", "optimis", "surperform", "upgrade", "beats", "surge", "rally", "soars", "raises", "record high", "jumps", "gains"];
const NEG = ["baisse", "chute", "recule", "plonge", "dégringole", "abaisse", "avertissement", "alerte", "perte", "déficit", "enquête", "amende", "grève", "licenci", "faillite", "procès", "rappel", "inquiét", "craint", "tension", "sanction", "dégrad", "downgrade", "misses", "plunge", "falls", "slump", "cuts", "warning", "lawsuit", "probe", "tumbles"];
export function tone(title) {
  const t = title.toLowerCase();
  let s = 0;
  for (const w of POS) if (t.includes(w)) s++;
  for (const w of NEG) if (t.includes(w)) s--;
  return s > 0 ? "positif" : s < 0 ? "négatif" : "neutre";
}

export async function fetchNews(query, count = 4, maxAgeH = 36) {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query + " when:2d")}&hl=fr&gl=FR&ceid=FR:fr`;
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = [];
    const re = /<item>([\s\S]*?)<\/item>/g;
    const tag = (b, n) => {
      const x = b.match(new RegExp(`<${n}[^>]*>([\\s\\S]*?)</${n}>`));
      return x ? x[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/<[^>]+>/g, "").trim() : "";
    };
    let m;
    const now = Date.now();
    while ((m = re.exec(xml))) {
      const b = m[1];
      let title = tag(b, "title");
      const source = tag(b, "source"), link = tag(b, "link"), pub = Date.parse(tag(b, "pubDate"));
      if (source && title.endsWith(" - " + source)) title = title.slice(0, -(source.length + 3));
      if (!title || !link) continue;
      if (!isNaN(pub) && now - pub > maxAgeH * 3600e3) continue;
      items.push({ title, link, source, time: isNaN(pub) ? null : pub, tone: tone(title) });
    }
    items.sort((a, b) => (b.time || 0) - (a.time || 0));
    return items.slice(0, count);
  } catch {
    return [];
  }
}

export function dedupeNews(list) {
  const seen = new Set();
  return list.filter((n) => {
    const k = n.title.toLowerCase().replace(/[^a-z0-9àâçéèêëîïôûùüÿñæœ]+/g, " ").slice(0, 70);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
