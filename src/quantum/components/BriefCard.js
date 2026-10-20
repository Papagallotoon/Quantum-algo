import React from "react";
import { View, Text } from "react-native";
import { C, T } from "../theme";

// Carte "En bref" : que faire, puis technique / fondamental / modele en une phrase chacun
export default function BriefCard(props) {
  var b = props.brief;
  if (!b) return null;
  var col = { ENTRER: C.up, EVITER: C.down, NEUTRE: C.soft };
  var rows = [["TECHNIQUE", b.tech], [props.isIndex ? "LES VALEURS" : "FONDAMENTAL", b.fund], ["LE MODÈLE", b.model]].filter(function (r) { return r[1]; });
  return (
    <View style={{ borderRadius: 22, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, paddingHorizontal: 16, paddingVertical: 16, gap: 12 }}>
      <Text style={[T.sans(15, "700"), { color: C.text }]}>{props.title || "En bref"}</Text>
      {b.todo ? (
        <Text style={[T.sans(13.5, "400"), { color: C.text, lineHeight: 20 }]}>
          <Text style={[T.sans(13.5, "700"), { color: col[b.todo.action] || C.alert }]}>{b.todo.word + " : "}</Text>
          {b.todo.text}
        </Text>
      ) : null}
      {rows.map(function (r) {
        return (
          <View key={r[0]} style={{ gap: 4, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 10 }}>
            <Text style={[T.sans(10.5, "600"), { color: C.brand, letterSpacing: 0.5 }]}>{r[0]}</Text>
            <Text style={[T.sans(12.5, "400"), { color: C.soft, lineHeight: 19 }]}>{r[1]}</Text>
          </View>
        );
      })}
      {b.warn ? (
        <View style={{ padding: 10, borderRadius: 12, backgroundColor: C.alertBg }}>
          <Text style={[T.sans(12, "500"), { color: C.alert, lineHeight: 17 }]}>{b.warn}</Text>
        </View>
      ) : null}
    </View>
  );
}
