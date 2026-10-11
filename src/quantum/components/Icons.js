import React from "react";
import Svg, { Path, Circle, Rect } from "react-native-svg";

// Icones au trait, reprises de la maquette (viewBox 24)
var P = {
  markets: [["p", "M4 19V10M10 19V5M16 19v-7M22 19H2"]],
  news: [["r", 3, 4, 18, 16, 3], ["p", "M7 9h10M7 13h10M7 17h6"]],
  star: [["p", "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"]],
  bilan: [["c", 12, 12, 9], ["p", "M8 12.5l2.8 2.8L16.5 9.5"]],
  learn: [["p", "M3 7l9-4 9 4-9 4z"], ["p", "M7 9v5c0 1.7 2.2 3 5 3s5-1.3 5-3V9"]],
  search: [["c", 11, 11, 7], ["p", "M16 16l4 4"]],
  sliders: [["p", "M4 7h10M18 7h2M4 17h4M12 17h8"], ["c", 16, 7, 2], ["c", 10, 17, 2]],
  back: [["p", "M15 5l-7 7 7 7"]],
  chev: [["p", "M9 6l6 6-6 6"]],
  down: [["p", "M6 9l6 6 6-6"]],
  up: [["p", "M6 15l6-6 6 6"]],
  info: [["c", 12, 12, 9], ["p", "M12 11v6M12 7.5v.5"]],
  trendUp: [["p", "M4 16l6-6 4 4 6-7"], ["p", "M15 7h5v5"]],
  trendDown: [["p", "M4 8l6 6 4-4 6 7"], ["p", "M15 17h5v-5"]],
  sort: [["p", "M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4"]],
  check: [["p", "M5 12.5l4.5 4.5L19 7.5"]],
  refresh: [["p", "M20 12a8 8 0 1 1-2.3-5.6"], ["p", "M20 4v4h-4"]],
  close: [["p", "M6 6l12 12M18 6L6 18"]],
};

export default function Icon(props) {
  var size = props.size || 22, color = props.color || "#94A0B4", sw = props.width || 1.8;
  var parts = P[props.name] || [];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {parts.map(function (p, i) {
        var common = { stroke: color, strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round", fill: props.fill && i === 0 ? props.fill : "none" };
        if (p[0] === "p") return <Path key={i} {...common} d={p[1]} />;
        if (p[0] === "c") return <Circle key={i} {...common} cx={p[1]} cy={p[2]} r={p[3]} />;
        return <Rect key={i} {...common} x={p[1]} y={p[2]} width={p[3]} height={p[4]} rx={p[5]} />;
      })}
    </Svg>
  );
}
