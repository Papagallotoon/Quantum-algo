import React from "react";
import { View, Text } from "react-native";
import { C, T } from "../theme";

function fr(v) { return v == null || !isFinite(v) ? "-" : Number(v).toFixed(v >= 1000 ? 0 : 2).replace(".", ","); }

// Plan du jour : scenarios conditionnels pour la seance, avec la position du cours en direct
export default function DayPlanCard(props) {
  var d = props.day;
  if (!d) return null;
  var st = d.state;
  var stateTxt = st === "up" ? "Le cours est AU-DESSUS du seuil haut : le scénario hausse est actif."
    : st === "down" ? "Le cours est SOUS le seuil bas : le scénario baisse est actif."
    : st === "flat" ? "Le cours est entre les deux seuils : rien à faire pour l'instant." : null;
  var stateCol = st === "up" ? C.up : st === "down" ? C.down : C.soft;
  function Row(p) {
    var on = st === p.k;
    return (
      <View style={{ flexDirection: "row", gap: 10, paddingVertical: 9, paddingHorizontal: 10, borderRadius: 12,
        backgroundColor: on ? (p.k === "up" ? C.upBg : p.k === "down" ? C.downBg : C.flatBg) : "transparent" }}>
        <Text style={[T.sans(13, "700"), { color: p.c, width: 14 }]}>{p.dot}</Text>
        <Text style={[T.sans(12.5, on ? "600" : "400"), { color: on ? C.text : C.soft, lineHeight: 19, flex: 1 }]}>{p.t}</Text>
      </View>
    );
  }
  return (
    <View style={{ borderRadius: 22, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, paddingHorizontal: 16, paddingVertical: 16, gap: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
        <Text style={[T.sans(15, "700"), { color: C.text }]}>Plan du jour</Text>
        <Text style={[T.mono(11.5, "500"), { color: C.dim }]}>{"fourchette " + fr(d.range.lo) + " – " + fr(d.range.hi)}</Text>
      </View>
      {stateTxt ? (
        <View style={{ padding: 10, borderRadius: 12, borderWidth: 1, borderColor: stateCol }}>
          <Text style={[T.sans(12.5, "600"), { color: stateCol, lineHeight: 18 }]}>{"Cours actuel " + fr(d.now) + " · " + stateTxt}</Text>
        </View>
      ) : null}
      <Row k="up" dot="▲" c={C.up} t={d.up.text} />
      <Row k="down" dot="▼" c={C.down} t={d.down.text} />
      <Row k="flat" dot="●" c={C.dim} t={d.flat} />
      {(d.alerts || []).map(function (a, i) {
        return (
          <View key={i} style={{ padding: 12, borderRadius: 14, backgroundColor: C.alertBg, gap: 5 }}>
            <Text style={[T.sans(13, "700"), { color: C.alert }]}>{"⚡ " + a.title}</Text>
            {a.rules.map(function (r, k) {
              return <Text key={k} style={[T.sans(12, "400"), { color: C.soft, lineHeight: 18 }]}>{"• " + r}</Text>;
            })}
          </View>
        );
      })}
      <Text style={[T.sans(11, "400"), { color: C.dim, lineHeight: 16 }]}>
        Ce ne sont pas des prévisions : le modèle n'a pas d'avantage mesuré à 1 jour. Ce sont des règles d'action selon ce que fait le cours en séance (seuils calculés sur la séance précédente).
      </Text>
    </View>
  );
}
