import React from "react";
import { View, Text } from "react-native";
import Svg, { Path, Line, Circle } from "react-native-svg";
import { C, T, tone } from "../theme";

// Jauge en demi-cercle : corail (baisse) - gris (pile ou face) - vert (hausse)
export default function Gauge(props) {
  var p = props.pUp == null ? 0.5 : Math.max(0, Math.min(1, props.pUp));
  var t = tone(props.pUp, props.base);
  var up = t.c === C.up, down = t.c === C.down;
  var th = Math.PI * (1 - p);
  var nx = (130 + 78 * Math.cos(th)).toFixed(1), ny = (130 - 78 * Math.sin(th)).toFixed(1);
  return (
    <View style={{ width: 260, height: 150, alignSelf: "center" }}>
      <Svg width={260} height={150} viewBox="0 0 260 150">
        <Path d="M 30 130 A 100 100 0 0 1 120.6 30.4" fill="none" stroke={C.down} strokeOpacity={down ? 1 : 0.22} strokeWidth={16} />
        <Path d="M 121.6 30.2 A 100 100 0 0 1 138.4 30.2" fill="none" stroke={C.dim} strokeOpacity={!up && !down ? 1 : 0.3} strokeWidth={16} />
        <Path d="M 139.4 30.4 A 100 100 0 0 1 230 130" fill="none" stroke={C.up} strokeOpacity={up ? 1 : 0.22} strokeWidth={16} />
        {props.pUp != null ? <Line x1={130} y1={130} x2={nx} y2={ny} stroke={C.text} strokeWidth={3.5} strokeLinecap="round" /> : null}
        <Circle cx={130} cy={130} r={8} fill={C.text} />
        <Circle cx={130} cy={130} r={3} fill={C.card} />
      </Svg>
      <Text style={[T.sans(10.5, "400"), { color: C.dim, position: "absolute", left: 14, bottom: 0 }]}>Baisse</Text>
      <Text style={[T.sans(10.5, "400"), { color: C.dim, position: "absolute", right: 14, bottom: 0 }]}>Hausse</Text>
    </View>
  );
}
