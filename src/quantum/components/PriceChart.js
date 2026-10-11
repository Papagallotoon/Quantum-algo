import React from "react";
import { View, Text } from "react-native";
import Svg, { Polyline, Polygon, Line, Circle } from "react-native-svg";
import { C, T } from "../theme";

// Cours des dernieres seances (trait clair) + cone de projection Monte-Carlo (couleur du sens)
export default function PriceChart(props) {
  var w = props.width;
  var h = 130;
  var split = w * 0.63;
  var color = props.color;
  var hist = props.history || [];
  if (hist.length < 2) return <View style={{ height: h }} />;

  var lo = Math.min.apply(null, hist), hi = Math.max.apply(null, hist);
  var p05 = props.p05, p95 = props.p95, med = props.median;
  if (p05 != null && !isNaN(p05)) lo = Math.min(lo, p05);
  if (p95 != null && !isNaN(p95)) hi = Math.max(hi, p95);
  var span = hi - lo || 1;
  var y = function (v) { return h - 6 - ((v - lo) / span) * (h - 12); };

  var pts = hist.map(function (v, i) { return [(i / (hist.length - 1)) * split, y(v)]; });
  var line = pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ");
  var last = pts[pts.length - 1];
  var cone = last[0] + "," + last[1] + " " + w + "," + y(p95 != null ? p95 : hi) + " " + w + "," + y(p05 != null ? p05 : lo);
  var midY = med != null && !isNaN(med) ? y(med) : (y(p95 != null ? p95 : hi) + y(p05 != null ? p05 : lo)) / 2;

  return (
    <View style={{ gap: 8 }}>
      <Svg width={w} height={h}>
        <Polygon points={cone} fill={color} fillOpacity={0.14} />
        <Line x1={split} y1={4} x2={split} y2={h - 4} stroke={C.line2} strokeWidth={1} strokeDasharray="3 4" />
        <Polyline points={line} fill="none" stroke={C.text} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <Line x1={split} y1={last[1]} x2={w} y2={midY} stroke={color} strokeWidth={2} strokeDasharray="4 4" />
        <Circle cx={split} cy={last[1]} r={5} fill={color} stroke={C.card} strokeWidth={3} />
      </Svg>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={[T.sans(11, "400"), { color: C.dim }]}>{hist.length + " séances"}</Text>
        <Text style={[T.sans(11, "400"), { color: C.dim }]}>Aujourd'hui</Text>
        <Text style={[T.sans(11, "600"), { color: color }]}>{"Projection " + (props.hLabel || "")}</Text>
      </View>
    </View>
  );
}
