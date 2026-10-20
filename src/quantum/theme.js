import { qaSig, qaVerdictLabel } from "./brief";
import { Platform } from "react-native";

// Systeme visuel "refonte" : fond bleu nuit, vert / corail reserves au sens,
// indigo pour la navigation et les selections, ambre pour les alertes et la liste suivie.
export const C = {
  bg: "#0A0D13",
  bgTop: "#0A0D13",
  card: "#131925",
  card2: "#1A2231",
  cardSolid: "#131925",
  line: "#232C3D",
  line2: "#2A3446",
  border: "#232C3D",
  borderSoft: "#1F2737",
  text: "#EEF2F7",
  soft: "#C9D1DE",
  dim: "#94A0B4",
  dimmer: "#6B778C",
  up: "#34D399",
  down: "#FF6B5B",
  flat: "#C9D1DE",
  ringUp: "#34D399",
  ringDown: "#FF6B5B",
  brand: "#8B93FF",
  brandInk: "#0B0E1A",
  alert: "#F5B740",
  ink: "#062016",
  upBg: "rgba(52,211,153,0.13)",
  downBg: "rgba(255,107,91,0.13)",
  flatBg: "rgba(148,160,180,0.14)",
  brandBg: "rgba(139,147,255,0.12)",
  alertBg: "rgba(245,183,64,0.12)",
  heart: "#FF4D6D",
  heartBg: "rgba(255,77,109,0.13)",
};

// Couleurs selon une probabilite de hausse (entre 47 et 53 % = pile ou face)
// base : niveau habituel a cet horizon (a 3 mois, ~56 % pour toutes les actions)
export function tone(pUp, base) {
  if (pUp == null || isNaN(pUp)) return { c: C.soft, bg: C.flatBg, label: "Pile ou face", word: "NEUTRE" };
  var g = qaSig(pUp, base), label = qaVerdictLabel(pUp, base);
  if (g > 0) return { c: C.up, bg: C.upBg, label: label, word: "HAUSSE" };
  if (g < 0) return { c: C.down, bg: C.downBg, label: label, word: "BAISSE" };
  return { c: C.soft, bg: C.flatBg, label: label, word: "NEUTRE" };
}

// Polices : Sora (texte) et JetBrains Mono (chiffres), chargees au demarrage.
// Tant qu'elles ne sont pas pretes (ou si le chargement echoue), on garde les polices systeme.
export const FONTS = { ready: false };
export const FONT_FILES = {
  "Sora-400": require("../../assets/fonts/Sora_400Regular.ttf"),
  "Sora-500": require("../../assets/fonts/Sora_500Medium.ttf"),
  "Sora-600": require("../../assets/fonts/Sora_600SemiBold.ttf"),
  "Sora-700": require("../../assets/fonts/Sora_700Bold.ttf"),
  "Mono-500": require("../../assets/fonts/JetBrainsMono_500Medium.ttf"),
  "Mono-600": require("../../assets/fonts/JetBrainsMono_600SemiBold.ttf"),
  "Mono-700": require("../../assets/fonts/JetBrainsMono_700Bold.ttf"),
};

export const MONO = Platform.OS === "ios" ? "Menlo" : "monospace";

function w(weight) {
  var n = parseInt(weight || "500", 10);
  return n >= 700 ? 700 : n >= 600 ? 600 : n >= 500 ? 500 : 400;
}

export const T = {
  mono: function (size, weight) {
    var k = Math.max(500, w(weight || "600"));
    return FONTS.ready ? { fontFamily: "Mono-" + k, fontSize: size } : { fontFamily: MONO, fontSize: size, fontWeight: String(k) };
  },
  sans: function (size, weight) {
    var k = w(weight || "500");
    return FONTS.ready ? { fontFamily: "Sora-" + k, fontSize: size } : { fontSize: size, fontWeight: String(k) };
  },
};
