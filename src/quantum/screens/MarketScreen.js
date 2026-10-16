import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { C, T, tone } from "../theme";
import { INDEX_DEFS } from "../universe";
import { useIndexData, useMarketData } from "../MarketData";
import SearchBar from "../components/SearchBar";
import SwipePager from "../components/SwipePager";
import StockRow from "../components/StockRow";
import Gauge from "../components/Gauge";
import Icon from "../components/Icons";
import { flagOf } from "../flags";
import { Chips, Segmented, Pill } from "../components/UI";

var H_LONG = { "1J": "demain", "1S": "dans une semaine", "1M": "dans un mois", "3M": "dans trois mois" };
var H_ITEMS = [{ id: "1J", label: "1 jour" }, { id: "1S", label: "1 sem." }, { id: "1M", label: "1 mois" }, { id: "3M", label: "3 mois" }];

function today() {
  try {
    var s = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    return s.charAt(0).toUpperCase() + s.slice(1);
  } catch (e) { return ""; }
}
function cap(s) { s = String(s || "").toLowerCase(); return s.charAt(0).toUpperCase() + s.slice(1); }

function MiniCard(props) {
  var s = props.stock;
  if (!s) return <View style={{ flex: 1 }} />;
  return (
    <Pressable onPress={props.onPress} accessibilityRole="button"
      style={{ flex: 1, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, padding: 14, gap: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Icon name={props.up ? "trendUp" : "trendDown"} size={14} width={2.4} color={props.up ? C.up : C.down} />
        <Text style={[T.sans(11.5, "500"), { color: C.dim }]}>{props.title}</Text>
      </View>
      <Text style={[T.sans(15, "600"), { color: C.text }]} numberOfLines={1}>{(flagOf(s.symbol || s.id) ? flagOf(s.symbol || s.id) + " " : "") + s.name}</Text>
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
        <Text style={[T.mono(22, "700"), { color: props.up ? C.up : C.down }]}>{s.score + " %"}</Text>
        <Text style={[T.sans(11, "600"), { color: props.up ? C.up : C.down }]}>{props.up ? "de hausse" : "de baisse"}</Text>
      </View>
    </Pressable>
  );
}

export default function MarketScreen(props) {
  var st = props.state;
  var def = INDEX_DEFS.filter(function (i) { return i.id === st.index; })[0] || INDEX_DEFS[0];
  var data = useIndexData(st.index);
  var md = useMarketData();
  var [help, setHelp] = useState(false);

  var pos = INDEX_DEFS.findIndex(function (i) { return i.id === st.index; });
  if (pos < 0) pos = 0;
  function goTo(delta) {
    var next = (pos + delta + INDEX_DEFS.length) % INDEX_DEFS.length;
    props.setState({ index: INDEX_DEFS[next].id });
  }
  function openSearched(symbol) { props.open(symbol); md.loadSymbol(symbol); }

  // un indice en erreur (symbole inconnu, historique trop court) ne doit rien afficher
  var idx = data.index && !data.index.error ? data.index : null;
  var idxError = data.error || (data.index && data.index.error ? data.index.error : null);
  var label = def.list ? "CAC 40" : def.label;
  var t = tone(idx ? idx.pUp : null);
  var open = idx && idx.marketState === "REGULAR";

  var rows = data.assets.slice().sort(function (a, b) {
    return st.sortByScore ? (b.dir * b.score) - (a.dir * a.score) : a.name.localeCompare(b.name);
  });
  var best = rows.filter(function (s) { return s.dir > 0 && s.score >= 53; }).sort(function (a, b) { return b.score - a.score; })[0];
  var worst = rows.filter(function (s) { return s.dir < 0 && s.score >= 53; }).sort(function (a, b) { return b.score - a.score; })[0];

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: C.brand, alignItems: "center", justifyContent: "center" }}>
            <Icon name="search" size={18} width={2.6} color={C.brandInk} />
          </View>
          <View>
            <Text style={[T.sans(16, "700"), { color: C.text, letterSpacing: -0.3 }]}>Quantum Algo</Text>
            <Text style={[T.sans(11.5, "400"), { color: C.dim }]}>{today()}</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, backgroundColor: C.card, borderWidth: 1, borderColor: C.line }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: open ? C.up : C.dim }} />
            <Text style={[T.sans(11.5, "500"), { color: C.soft }]}>{cap(def.place) + " · " + (open ? "ouvert" : "fermé")}</Text>
          </View>
          <Pressable onPress={function () { props.setState({ tab: "settings" }); }} accessibilityLabel="Réglages"
            style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, alignItems: "center", justifyContent: "center" }}>
            <Icon name="sliders" size={18} color={C.soft} />
          </Pressable>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 12, zIndex: 20 }}>
        <SearchBar onSelect={openSearched} />
      </View>

      <Chips items={INDEX_DEFS.map(function (i) { return { id: i.id, label: flagOf(i.id) + " " + (i.name === "NASDAQ" ? "Nasdaq" : i.name === "NIKKEI" ? "Nikkei" : i.name === "DOW" ? "Dow" : i.name) }; })}
        value={st.index} onChange={function (id) { props.setState({ index: id }); }} />

      <SwipePager canPrev canNext onPrev={function () { goTo(-1); }} onNext={function () { goTo(1); }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24, gap: 14 }}
        refreshControl={<RefreshControl refreshing={data.loading} onRefresh={data.refresh} tintColor={C.dim} />}
      >
        <View style={{ borderRadius: 26, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 20, gap: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
            <View style={{ gap: 4 }}>
              <Text style={[T.sans(12, "500"), { color: C.dim }]}>{label}</Text>
              <Text style={[T.mono(22, "600"), { color: C.text, letterSpacing: -0.5 }]}>{idx ? idx.price : "—"}</Text>
            </View>
            {idx ? (
              <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: idx.changeRaw >= 0 ? C.upBg : C.downBg }}>
                <Text style={[T.mono(13, "600"), { color: idx.changeRaw >= 0 ? C.up : C.down }]}>{idx.change}</Text>
              </View>
            ) : null}
          </View>

          {idx ? (
            <>
              <Gauge pUp={idx.pUp} />
              <View style={{ alignItems: "center", gap: 6, marginTop: -4 }}>
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
                  <Text style={[T.mono(48, "700"), { color: t.c, letterSpacing: -2 }]}>{Math.round(idx.pUp * 100)}</Text>
                  <Text style={[T.mono(22, "600"), { color: t.c }]}>%</Text>
                </View>
                <Text style={[T.sans(13.5, "400"), { color: C.soft, textAlign: "center" }]}>
                  {"de chances que le " + label + " finisse plus haut " + (H_LONG[st.horizon] || "")}
                </Text>
                <Pill bg={t.bg} color={t.c} style={{ alignSelf: "center", marginTop: 6 }}>{t.label}</Pill>
              </View>
            </>
          ) : data.loading ? (
            <ActivityIndicator color={C.dim} style={{ marginVertical: 60 }} />
          ) : (
            <Text style={[T.sans(30, "700"), { color: C.dimmer, textAlign: "center", marginVertical: 50 }]}>—</Text>
          )}

          <Segmented items={H_ITEMS} value={st.horizon} onChange={function (h) { props.setState({ horizon: h }); }} />

          <View style={{ borderTopWidth: 1, borderTopColor: C.line, paddingTop: 12 }}>
            <Pressable onPress={function () { setHelp(!help); }} style={{ flexDirection: "row", alignItems: "center", gap: 8 }} accessibilityRole="button">
              <Icon name="info" size={16} width={2} color={C.brand} />
              <Text style={[T.sans(12.5, "500"), { color: C.soft, flex: 1 }]}>Comment lire ce chiffre ?</Text>
              <Icon name={help ? "up" : "down"} size={14} color={C.dim} />
            </Pressable>
            {help ? (
              <Text style={[T.sans(12.5, "400"), { color: C.dim, lineHeight: 19, marginTop: 10 }]}>
                {"Ce n'est pas une hausse en %, c'est une probabilité. Entre 47 et 53 %, c'est pile ou face. Calibré sur l'historique réel, " + st.sims.toLocaleString("fr-FR") + " scénarios simulés. Information statistique, pas un conseil."}
              </Text>
            ) : null}
          </View>
        </View>

        {idxError ? (
          <View style={{ borderWidth: 1, borderColor: "rgba(255,107,91,0.4)", backgroundColor: "rgba(255,107,91,0.08)", borderRadius: 18, padding: 16 }}>
            <Text style={[T.sans(13, "600"), { color: C.down, marginBottom: 5 }]}>Données indisponibles</Text>
            <Text style={[T.sans(12, "400"), { color: C.dim, lineHeight: 17 }]}>{def.label + " : " + idxError}</Text>
            <Pressable onPress={data.refresh} style={{ marginTop: 12, alignSelf: "flex-start", height: 40, justifyContent: "center", paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: C.line2 }}>
              <Text style={[T.sans(12.5, "600"), { color: C.text }]}>Réessayer</Text>
            </Pressable>
          </View>
        ) : null}

        {def.note ? (
          <View style={{ backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: 14 }}>
            <Text style={[T.sans(12, "400"), { color: C.dim, lineHeight: 18 }]}>
              {def.note + ". La jauge reprend l'estimation du CAC 40, indice de référence de ces valeurs."}
            </Text>
          </View>
        ) : null}

        {best || worst ? (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <MiniCard stock={best} up title="Meilleure chance" onPress={function () { props.open(best.id); }} />
            <MiniCard stock={worst} title="À éviter" onPress={function () { props.open(worst.id); }} />
          </View>
        ) : null}

        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={[T.sans(17, "700"), { color: C.text, letterSpacing: -0.3, flex: 1 }]} numberOfLines={1}>
              {(def.list ? "Valeurs " : "Valeurs du ") + (def.list ? def.label : label)}
            </Text>
            <Pressable onPress={function () { props.setState({ sortByScore: !st.sortByScore }); }} accessibilityRole="button"
              style={{ height: 34, paddingHorizontal: 12, borderRadius: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Icon name="sort" size={13} width={2} color={C.soft} />
              <Text style={[T.sans(12, "500"), { color: C.soft }]}>{st.sortByScore ? "Conviction" : "A → Z"}</Text>
            </Pressable>
          </View>

          {data.loading && rows.length === 0 ? (
            <ActivityIndicator color={C.dim} style={{ marginTop: 20 }} />
          ) : (
            <View style={{ gap: 8 }}>
              {rows.map(function (s) {
                return <StockRow key={s.id} stock={s} onPress={function () { props.open(s.id); }} />;
              })}
            </View>
          )}
        </View>
      </ScrollView>
      </SwipePager>
    </View>
  );
}
