// Univers elargi utilise par la routine du matin (site + newsletter).
// L'app mobile garde la liste courte de universe.js (moins de requetes sur le telephone).
// Un symbole introuvable chez Yahoo est simplement ignore par la routine.

import { COMPONENTS, NEWS_NAMES } from "./universe.js";

const EXTRA = {
  cac: {
    "AC.PA": "Accor", "MT.AS": "ArcelorMittal", "CS.PA": "AXA", "EN.PA": "Bouygues", "CAP.PA": "Capgemini",
    "CA.PA": "Carrefour", "ACA.PA": "Credit Agricole", "BN.PA": "Danone", "DSY.PA": "Dassault Systemes",
    "EDEN.PA": "Edenred", "ENGI.PA": "Engie", "EL.PA": "EssilorLuxottica", "ERF.PA": "Eurofins",
    "KER.PA": "Kering", "LR.PA": "Legrand", "ML.PA": "Michelin", "ORA.PA": "Orange", "RI.PA": "Pernod Ricard",
    "PUB.PA": "Publicis", "RNO.PA": "Renault", "SAF.PA": "Safran", "SGO.PA": "Saint-Gobain",
    "GLE.PA": "Societe Generale", "STLAP.PA": "Stellantis", "STMPA.PA": "STMicroelectronics",
    "TEP.PA": "Teleperformance", "HO.PA": "Thales", "URW.PA": "Unibail-Rodamco-Westfield",
    "VIE.PA": "Veolia", "BVI.PA": "Bureau Veritas",
  },
  sbf: {
    "ADP.PA": "Aeroports de Paris", "AF.PA": "Air France-KLM", "ALO.PA": "Alstom", "AMUN.PA": "Amundi",
    "ATE.PA": "Alten", "AYV.PA": "Ayvens", "BB.PA": "Bic", "BIM.PA": "bioMerieux", "BOL.PA": "Bollore",
    "COFA.PA": "Coface", "COV.PA": "Covivio", "DIM.PA": "Sartorius Stedim Biotech", "ELIS.PA": "Elis",
    "ERA.PA": "Eramet", "FDJ.PA": "FDJ United", "FGR.PA": "Eiffage", "FRVIA.PA": "Forvia", "GET.PA": "Getlink",
    "GFC.PA": "Gecina", "GTT.PA": "GTT", "ICAD.PA": "Icade", "IPN.PA": "Ipsen", "IPS.PA": "Ipsos",
    "LI.PA": "Klepierre", "MMT.PA": "M6 Metropole", "NEX.PA": "Nexans", "NK.PA": "Imerys", "OVH.PA": "OVHcloud",
    "PLX.PA": "Pluxee", "RCO.PA": "Remy Cointreau", "RUI.PA": "Rubis", "RXL.PA": "Rexel", "SCR.PA": "SCOR",
    "SK.PA": "SEB", "SOI.PA": "Soitec", "SOP.PA": "Sopra Steria", "SPIE.PA": "Spie", "SW.PA": "Sodexo",
    "TFI.PA": "TF1", "TRI.PA": "Trigano", "UBI.PA": "Ubisoft", "VK.PA": "Vallourec", "VIV.PA": "Vivendi",
    "WLN.PA": "Worldline", "VCT.PA": "Vicat", "BEN.PA": "Beneteau", "NXI.PA": "Nexity", "VLA.PA": "Valneva",
  },
  spx: {
    ABBV: "AbbVie", ABT: "Abbott", AMD: "AMD", AMGN: "Amgen", BA: "Boeing", BAC: "Bank of America",
    C: "Citigroup", CRM: "Salesforce", CSCO: "Cisco", CVX: "Chevron", DIS: "Disney", F: "Ford",
    GE: "GE Aerospace", GM: "General Motors", GS: "Goldman Sachs", HD: "Home Depot", IBM: "IBM",
    INTC: "Intel", LLY: "Eli Lilly", LMT: "Lockheed Martin", MA: "Mastercard", MRK: "Merck", MS: "Morgan Stanley",
    NFLX: "Netflix", NKE: "Nike", ORCL: "Oracle", PEP: "PepsiCo", PFE: "Pfizer", PLTR: "Palantir",
    RTX: "RTX Raytheon", T: "AT&T", TMO: "Thermo Fisher", UNH: "UnitedHealth", UBER: "Uber", VZ: "Verizon",
  },
  ndx: {
    ADBE: "Adobe", AMD: "AMD", ASML: "ASML", ABNB: "Airbnb", ARM: "Arm Holdings", BKNG: "Booking",
    CRWD: "CrowdStrike", CSCO: "Cisco", GOOGL: "Google Alphabet", INTC: "Intel", INTU: "Intuit", MU: "Micron",
    NFLX: "Netflix", PANW: "Palo Alto Networks", PEP: "PepsiCo", PYPL: "PayPal", QCOM: "Qualcomm",
    SBUX: "Starbucks", TXN: "Texas Instruments", COIN: "Coinbase", SHOP: "Shopify", PLTR: "Palantir",
  },
  dji: {
    AMGN: "Amgen", AMZN: "Amazon", AXP: "American Express", BA: "Boeing", CRM: "Salesforce", CSCO: "Cisco",
    CVX: "Chevron", DIS: "Disney", GS: "Goldman Sachs", HD: "Home Depot", HON: "Honeywell", IBM: "IBM",
    MMM: "3M", MRK: "Merck", NKE: "Nike", NVDA: "Nvidia", SHW: "Sherwin-Williams", TRV: "Travelers",
    UNH: "UnitedHealth", V: "Visa", VZ: "Verizon", WMT: "Walmart",
  },
  dax: {
    "ADS.DE": "Adidas", "AIR.DE": "Airbus", "BAYN.DE": "Bayer", "BEI.DE": "Beiersdorf", "BNR.DE": "Brenntag",
    "CBK.DE": "Commerzbank", "CON.DE": "Continental", "DB1.DE": "Deutsche Boerse", "DBK.DE": "Deutsche Bank",
    "DHL.DE": "DHL Group", "DTG.DE": "Daimler Truck", "ENR.DE": "Siemens Energy", "EOAN.DE": "E.ON",
    "FRE.DE": "Fresenius", "HEI.DE": "Heidelberg Materials", "HEN3.DE": "Henkel", "HNR1.DE": "Hannover Re",
    "IFX.DE": "Infineon", "MBG.DE": "Mercedes-Benz", "MRK.DE": "Merck KGaA", "MTX.DE": "MTU Aero Engines",
    "MUV2.DE": "Munich Re", "P911.DE": "Porsche", "PAH3.DE": "Porsche SE", "QIA.DE": "Qiagen",
    "RHM.DE": "Rheinmetall", "RWE.DE": "RWE", "SRT3.DE": "Sartorius", "SY1.DE": "Symrise",
    "VNA.DE": "Vonovia", "VOW3.DE": "Volkswagen", "ZAL.DE": "Zalando",
  },
  mib: {
    "A2A.MI": "A2A", "AMP.MI": "Amplifon", "AZM.MI": "Azimut", "BAMI.MI": "Banco BPM", "BMED.MI": "Banca Mediolanum",
    "BPE.MI": "BPER Banca", "CPR.MI": "Campari", "DIA.MI": "DiaSorin", "ERG.MI": "ERG", "FBK.MI": "FinecoBank",
    "HER.MI": "Hera", "INW.MI": "Inwit", "IP.MI": "Interpump", "LDO.MI": "Leonardo", "MB.MI": "Mediobanca",
    "MONC.MI": "Moncler", "NEXI.MI": "Nexi", "PIRC.MI": "Pirelli", "PRY.MI": "Prysmian", "PST.MI": "Poste Italiane",
    "REC.MI": "Recordati", "SPM.MI": "Saipem", "SRG.MI": "Snam", "STMMI.MI": "STMicroelectronics",
    "TEN.MI": "Tenaris", "TRN.MI": "Terna", "UNI.MI": "Unipol",
  },
  nkx: {
    "6501.T": "Hitachi", "6098.T": "Recruit", "8058.T": "Mitsubishi Corp", "8001.T": "Itochu",
    "7974.T": "Nintendo", "9983.T": "Fast Retailing (Uniqlo)", "6367.T": "Daikin", "4502.T": "Takeda",
    "7267.T": "Honda", "6902.T": "Denso", "8316.T": "Sumitomo Mitsui", "8411.T": "Mizuho", "6954.T": "Fanuc",
    "7741.T": "Hoya", "4568.T": "Daiichi Sankyo", "6981.T": "Murata", "9433.T": "KDDI", "7011.T": "Mitsubishi Heavy",
  },
};

export const FULL_COMPONENTS = {};
export const FULL_NAMES = { ...NEWS_NAMES };
for (const id of Object.keys(COMPONENTS)) {
  const extra = EXTRA[id] || {};
  FULL_COMPONENTS[id] = [...new Set([...(COMPONENTS[id] || []).filter((s) => s !== "SYS.DE"), ...Object.keys(extra)])];
  for (const [s, n] of Object.entries(extra)) if (!FULL_NAMES[s]) FULL_NAMES[s] = n;
}
// le SBF 120 contient aussi tout le CAC 40
FULL_COMPONENTS.sbf = [...new Set([...FULL_COMPONENTS.cac, ...FULL_COMPONENTS.sbf])];
