import React from "react";
import { View, Text, useWindowDimensions } from "react-native";
import { SvgXml } from "react-native-svg";
import { C, T } from "../theme";

// Schema SVG du lexique, a la largeur disponible
export default function Diagram(props) {
  var d = props.diagram;
  var win = useWindowDimensions();
  if (!d) return null;
  var w = Math.min(520, win.width - (props.inset || 68));
  return (
    <View style={{ borderRadius: 14, backgroundColor: C.bg, padding: 10, gap: 6 }}>
      {props.showTitle === false ? null : <Text style={[T.sans(11, "600"), { color: C.dim }]}>{d.t}</Text>}
      <SvgXml xml={d.svg} width={w - 20} height={(w - 20) * d.h / 420} />
    </View>
  );
}
