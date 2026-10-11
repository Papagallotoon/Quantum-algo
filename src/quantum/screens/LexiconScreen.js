import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Linking } from "react-native";
import { C, T } from "../theme";
import { LEXICON, LEX_CATS } from "../lexicon";
import { ScreenTitle } from "../components/UI";
import Icon from "../components/Icons";
import Diagram from "../components/Diagram";
import { diagramFor } from "../diagrams";

var SITE_LEARN = "https://papagallotoon.github.io/Quantum-algo/#/apprendre";
var CAT_COL = { Trading: "#F5B740", Concepts: "#8B93FF", Tendance: "#34D399", Momentum: "#5EC8F2", Volatilite: "#FF6B5B", Volume: "#C9A7FF", Structure: "#EEF2F7" };
var CAT_LABEL = { Volatilite: "Volatilité" };
var STOP = { de: 1, du: 1, des: 1, la: 1, le: 1, les: 1, et: 1, a: 1, "à": 1, en: 1, d: 1, l: 1 };

function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
function abbr(t) {
  var first = String(t).split(/[\s(]/)[0];
  if (/^[A-Z0-9+\/%-]{2,5}$/.test(first)) return first;
  var w = String(t).replace(/\(.*\)/, "").split(/[\s'’-]+/).filter(function (x) { return x && !STOP[x.toLowerCase()]; });
  if (w.length === 1) { var caps = w[0].replace(/[^A-Z]/g, ""); return caps.length >= 2 ? caps.slice(0, 4) : w[0].slice(0, 3).toUpperCase(); }
  var a = w.slice(0, 3).map(function (x) { return x.charAt(0).toUpperCase(); }).join("");
  return a || first.slice(0, 3).toUpperCase();
}

export default function LexiconScreen() {
  var [cat, setCat] = useState("Tous");
  var [q, setQ] = useState("");
  var [open, setOpen] = useState(null);

  var list = LEXICON.filter(function (e) {
    if (cat !== "Tous" && e.c !== cat) return false;
    if (!q.trim()) return true;
    var n = norm(q);
    return norm(e.t).indexOf(n) >= 0 || norm(e.s).indexOf(n) >= 0 || norm(e.l).indexOf(n) >= 0;
  });
  var day = Math.floor(Date.now() / 86400000);
  var td = LEXICON[day % LEXICON.length];

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 16 }}>
      <ScreenTitle title="Apprendre" sub="Les mots de la bourse, expliqués simplement." />

      {td ? (
        <Pressable onPress={function () { setCat("Tous"); setQ(""); setOpen(td.t); }}
          style={{ borderRadius: 24, backgroundColor: "#161C2B", borderWidth: 1, borderColor: "rgba(139,147,255,0.35)", paddingHorizontal: 16, paddingVertical: 18, gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={[T.sans(11.5, "600"), { color: C.brand, letterSpacing: 0.6 }]}>LE TERME DU JOUR</Text>
            <Text style={[T.sans(11, "400"), { color: C.dim }]}>{CAT_LABEL[td.c] || td.c}</Text>
          </View>
          <Text style={[T.sans(20, "700"), { color: C.text, letterSpacing: -0.4 }]}>{td.t}</Text>
          <Text style={[T.sans(13, "400"), { color: C.soft, lineHeight: 20 }]}>{td.s}</Text>
          <Diagram diagram={diagramFor(td.t)} inset={72} showTitle={false} />
        </Pressable>
      ) : null}

      <Pressable onPress={function () { Linking.openURL(SITE_LEARN).catch(function () {}); }} accessibilityRole="link"
        style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 18, backgroundColor: C.card, borderWidth: 1, borderColor: C.line }}>
        <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: C.brandBg, alignItems: "center", justifyContent: "center" }}>
          <Icon name="learn" size={20} width={2} color={C.brand} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[T.sans(14, "600"), { color: C.text }]}>Cours et quiz</Text>
          <Text style={[T.sans(12, "400"), { color: C.dim }]}>Débutant, intermédiaire et pro, sur le site</Text>
        </View>
        <Icon name="chev" size={16} width={2} color={C.dim} />
      </Pressable>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, height: 48, paddingHorizontal: 14, borderRadius: 16, backgroundColor: C.card, borderWidth: 1, borderColor: C.line }}>
        <Icon name="search" size={18} color={C.dim} />
        <TextInput value={q} onChangeText={setQ} placeholder="Chercher un terme" placeholderTextColor={C.dimmer} accessibilityLabel="Chercher un terme"
          style={[T.sans(14, "400"), { color: C.text, flex: 1, paddingVertical: 10 }]} />
        {q ? (
          <Pressable onPress={function () { setQ(""); }} hitSlop={10} accessibilityLabel="Effacer">
            <Icon name="close" size={16} color={C.dim} />
          </Pressable>
        ) : null}
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {LEX_CATS.map(function (c) {
          var on = c === cat;
          return (
            <Pressable key={c} onPress={function () { setCat(c); }}
              style={{ height: 36, paddingHorizontal: 14, borderRadius: 999, justifyContent: "center", borderWidth: 1, borderColor: on ? C.brand : C.line2, backgroundColor: on ? C.brand : C.card }}>
              <Text style={[T.sans(12.5, "600"), { color: on ? C.brandInk : C.soft }]}>{CAT_LABEL[c] || c}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[T.sans(12, "400"), { color: C.dim }]}>{list.length + (list.length > 1 ? " termes" : " terme")}</Text>

      <View style={{ gap: 8 }}>
        {list.map(function (e) {
          var isOpen = open === e.t;
          var col = CAT_COL[e.c] || C.brand;
          return (
            <View key={e.t} style={{ borderRadius: 18, backgroundColor: C.card, borderWidth: 1, borderColor: isOpen ? "rgba(139,147,255,0.4)" : C.line, overflow: "hidden" }}>
              <Pressable onPress={function () { setOpen(isOpen ? null : e.t); }} accessibilityRole="button"
                style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: col + "22" }}>
                  <Text style={[T.mono(11.5, "700"), { color: col }]}>{abbr(e.t)}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                  <Text style={[T.sans(14, "600"), { color: C.text }]}>{e.t}</Text>
                  <Text style={[T.sans(12, "400"), { color: C.dim }]}>{e.s}</Text>
                </View>
                <Icon name={isOpen ? "up" : "down"} size={16} width={2} color={C.dim} />
              </Pressable>
              {isOpen && diagramFor(e.t) ? (
                <View style={{ paddingHorizontal: 14, paddingBottom: 10 }}>
                  <Diagram diagram={diagramFor(e.t)} inset={70} />
                </View>
              ) : null}
              {isOpen ? (
                <View style={{ paddingLeft: 70, paddingRight: 14, paddingBottom: 14, gap: 10 }}>
                  <Text style={[T.sans(12.5, "400"), { color: C.soft, lineHeight: 19 }]}>{e.l}</Text>
                  {e.e ? (
                    <View style={{ padding: 12, borderRadius: 12, backgroundColor: C.card2, gap: 4 }}>
                      <Text style={[T.sans(10.5, "600"), { color: C.brand, letterSpacing: 0.5 }]}>EXEMPLE</Text>
                      <Text style={[T.sans(12, "400"), { color: C.dim, lineHeight: 18 }]}>{e.e}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        })}
        {list.length === 0 ? (
          <View style={{ borderWidth: 1, borderColor: C.line2, borderStyle: "dashed", borderRadius: 18, padding: 24, alignItems: "center" }}>
            <Text style={[T.sans(13, "500"), { color: C.dim }]}>Aucun terme trouvé</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
