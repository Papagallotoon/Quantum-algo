// Onglet PGM : analyse Quantum Algo des fonds Credit Mutuel AM, publiee CHIFFREE.
// Le code d'acces n'est jamais ecrit dans le depot : il vient du secret GitHub PGM_CODE.
// Chiffrement AES-GCM 256, cle derivee du code par PBKDF2-SHA256 (250 000 tours) : sans le code,
// le fichier docs/pgm.enc.json est illisible, meme si le site est public.
import crypto from "node:crypto";
import { PGM_FUNDS, PGM_CATS } from "./pgm-funds.mjs";

const HOSTS = ["https://query2.finance.yahoo.com", "https://query1.finance.yahoo.com"];
const HEADERS = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36", Accept: "application/json" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ISIN -> symbole Yahoo (fonds : souvent 0P0000xxxx.F) ; resultat garde en cache entre deux matins
export async function resolveIsin(isin) {
  for (let k = 0; k < 2; k++) {
    try {
      const res = await fetch(`${HOSTS[k]}/v1/finance/search?q=${isin}&quotesCount=6&newsCount=0`, { headers: HEADERS });
      if (!res.ok) { await sleep(600); continue; }
      const j = await res.json();
      const q = (j.quotes || []).filter((x) => x.symbol);
      const best = q.find((x) => x.quoteType === "MUTUALFUND") || q.find((x) => x.quoteType === "ETF") || q[0];
      return best ? best.symbol : null;
    } catch (e) { await sleep(600); }
  }
  return null;
}

/**
 * Construit les donnees PGM.
 * deps : { fetchCandles, analyse(c) -> objet d'analyse ou null, cache {isin: symbole|""} , log }
 */
export async function buildPgm(deps) {
  const { analyse, cache, log } = deps;
  const resolve = deps.resolve || resolveIsin;
  const out = [], missing = [];
  for (const [name, cat, sri, parts] of PGM_FUNDS) {
    let got = null;
    for (const [part, isin] of parts) {
      let sym = cache[isin];
      if (sym === undefined) { sym = (await resolve(isin)) || ""; cache[isin] = sym; if (!deps.resolve) await sleep(150); }
      if (!sym) continue;
      try {
        const c = await deps.fetchCandles(sym, "3y");
        if (c.close.length < 40) continue;
        // on garde la part la plus longue parmi les 2 premieres trouvees
        if (!got || c.close.length > got.c.close.length + 120) got = { part, isin, sym, c };
        if (got.c.close.length >= 400) break;
      } catch (e) { /* part suivante */ }
    }
    if (!got) { missing.push(name); continue; }
    const a = analyse(got.c);
    out.push({ n: name, k: cat, sri, part: got.part, isin: got.isin, sym: got.sym, cur: got.c.currency || "EUR", ...a });
  }
  log && log(`PGM : ${out.length} fonds analyses sur ${PGM_FUNDS.length}` + (missing.length ? ` (sans cours : ${missing.slice(0, 8).join(", ")}${missing.length > 8 ? "…" : ""})` : ""));
  return { cats: PGM_CATS, funds: out, missing };
}

export function encryptJson(obj, code) {
  const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(String(code), salt, 250000, 32, "sha256");
  const c = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([c.update(JSON.stringify(obj), "utf8"), c.final(), c.getAuthTag()]);
  return { v: 1, kdf: "PBKDF2-SHA256", it: 250000, salt: salt.toString("base64"), iv: iv.toString("base64"), data: enc.toString("base64") };
}
