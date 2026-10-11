import React from "react";
import { View, Text, Pressable } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import { C, T } from "../theme";

function sparkPts(src) {
  if (!src || src.length < 2) return null;
  var step = Math.max(1, Math.floor(src.length / 20));
  var d = src.filter(function (_, i) { return i % step === 0; });
  var lo = Math.min.apply(null, d), hi = Math.max.apply(null, d), sp = hi - lo || 1;
  return d.map(function (v, i) { return (i / (d.length - 1) * 54 + 1).toFixed(1) + "," + (24 - (v - lo) / sp * 22).toFixed(1); }).join(" ");
}

// Ligne d'une valeur : pastille de score, nom, mini-graphique, variation du jour
export default function StockRow(props) {
  var s = props.stock;
  var dir = s.dir || 1;
  var strong = s.score >= 53;
  var color = !strong ? C.soft : dir < 0 ? C.down : C.up;
  var bg = !strong ? C.flatBg : dir < 0 ? C.downBg : C.upBg;
  var word = !strong ? "NEUTRE" : dir < 0 ? "BAISSE" : "HAUSSE";
  var pts = sparkPts(s.history);
  var chg = s.changeRaw;
  return (
    <Pressable onPress={props.onPress} accessibilityRole="button"
      style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 18 }}>
      <View style={{ width: 52, height: 48, borderRadius: 14, backgroundColor: bg, alignItems: "center", justifyContent: "center", gap: 2 }}>
        <Text style={[T.mono(15, "700"), { color: color, lineHeight: 17 }]}>{s.score}</Text>
        <Text style={[T.sans(8.5, "600"), { color: color, letterSpacing: 0.4 }]}>{word}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text style={[T.sans(14.5, "600"), { color: C.text }]} numberOfLines={1}>{s.name}</Text>
        <Text style={[T.sans(11.5, "400"), { color: C.dim }]} numberOfLines={1}>{String(s.sub || "").replace(" / ", " · ")}</Text>
      </View>
      {pts ? (
        <Svg width={56} height={26} viewBox="0 0 56 26">
          <Polyline points={pts} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
        </Svg>
      ) : null}
      {chg != null && !isNaN(chg) ? (
        <Text style={[T.mono(12.5, "600"), { width: 62, textAlign: "right", color: chg >= 0 ? C.up : C.down }]}>
          {(chg >= 0 ? "+" : "") + chg.toFixed(2).replace(".", ",") + " %"}
        </Text>
      ) : null}
    </Pressable>
  );
}
