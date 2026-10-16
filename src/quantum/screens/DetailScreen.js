import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, useWindowDimensions } from "react-native";
import { C, T } from "../theme";
import { useMarketData } from "../MarketData";
import { CATS } from "../core/signals.js";
import { HORIZON_LABEL } from "../core/model.js";
import { planFor } from "../model/build";
import PlanCard from "../components/PlanCard";
import { useNews } from "../useNews";
import { newsQuery } from "../universe";
import NewsList from "../components/NewsList";
import Dial from "../components/Dial";
import PriceChart from "../components/PriceChart";
import Icon from "../components/Icons";
import { flagOf } from "../flags";
import { Card, Segmented, Chips, Stat } from "../components/UI";

function Row(props) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
      <Text style={[T.sans(12.5, "400"), { color: C.dim }]}>{props.k}</Text>
      <Text style={[T.mono(12.5, "600"), { color: props.color || C.text }]}>{props.v}</Text>
    </View>
  );
}

export default function DetailScreen(props) {
  var st = props.state;
  var md = useMarketData();
  var win = useWindowDimensions();
  var s = md.getAsset(st.detail);
  var pending = !!md.loading[st.detail];
  // les hooks doivent etre appeles avant tout "return" conditionnel,
  // sinon React plante au passage chargement -> affichage
  var news = useNews(st.detail ? newsQuery(st.detail) : null, 6);
  var [planH, setPlanH] = useState(null);
  useEffect(function () { setPlanH(null); }, [st.detail]);

  // une valeur ouverte depuis la recherche n'est pas encore en cache : on la charge
  useEffect(function () {
    if (!s && st.detail && !pending && !md.errors[st.detail]) md.loadSymbol(st.detail);
  }, [st.detail, !!s]);

  if (!s && (pending || !md.errors[st.detail])) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 14 }}>
        <ActivityIndicator color={C.dim} />
        <Text style={[T.mono(12, "500"), { color: C.dim }]}>{String(st.detail).toUpperCase()}</Text>
        <Pressable onPress={props.back} hitSlop={12}>
          <Text style={[T.sans(13, "500"), { color: C.soft }]}>Annuler</Text>
        </Pressable>
      </View>
    );
  }

  if (!s || s.error) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text style={[T.sans(14, "500"), { color: C.dim, textAlign: "center" }]}>
          {s && s.error ? s.error : md.errors[st.detail] || "Valeur indisponible."}
        </Text>
        <Pressable onPress={props.back} style={{ marginTop: 16, height: 44, justifyContent: "center", paddingHorizontal: 18, borderRadius: 14, borderWidth: 1, borderColor: C.line2 }}>
          <Text style={[T.sans(13, "600"), { color: C.text }]}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  var dir = s.dir;
  var strongS = s.score >= 53;
  var color = !strongS ? C.soft : dir < 0 ? C.down : C.up;
  var cons = s.cons;
  var watched = st.watch.indexOf(s.id) >= 0;
  var chartW = win.width - 40 - 32;
  var plan = planFor(s, planH);
  var hLabel = HORIZON_LABEL[st.horizon] || st.horizon;
  var verdictColor = s.pUp >= 0.54 ? C.up : s.pUp <= 0.46 ? C.down : C.soft;

  var header = (
    <View style={{ paddingHorizontal: 20, gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Pressable onPress={props.back} accessibilityLabel="Retour"
          style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, alignItems: "center", justifyContent: "center" }}>
          <Icon name="back" size={18} width={2} color={C.text} />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text style={[T.sans(18, "700"), { color: C.text, letterSpacing: -0.3 }]} numberOfLines={1}>{(flagOf(s.symbol || s.id) ? flagOf(s.symbol || s.id) + " " : "") + s.name}</Text>
          <Text style={[T.mono(11.5, "500"), { color: C.dim }]} numberOfLines={1}>{String(s.ticker || "").replace(" / ", " · ")}</Text>
        </View>
        <Pressable onPress={function () { props.toggleWatch(s.id); }} accessibilityLabel="Suivre cette valeur"
          style={{ height: 44, paddingHorizontal: 14, borderRadius: 14, flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1,
            borderColor: watched ? "rgba(245,183,64,0.5)" : C.line, backgroundColor: watched ? C.alertBg : C.card }}>
          <Icon name="star" size={16} width={2} color={watched ? C.alert : C.soft} fill={watched ? C.alert : null} />
          <Text style={[T.sans(12.5, "600"), { color: watched ? C.alert : C.soft }]}>{watched ? "Suivie" : "Suivre"}</Text>
        </Pressable>
      </View>
      <Segmented items={[{ id: "est", label: "Estimation" }, { id: "tech", label: "Technique" }]} value={st.detailTab}
        onChange={function (id) { props.setState({ detailTab: id }); }} />
    </View>
  );

  function consensusBar() {
    var pw = function (n) { return (n / cons.directional) * 100 + "%"; };
    return (
      <View>
        <View style={{ flexDirection: "row", height: 28, borderRadius: 9, overflow: "hidden", gap: 3 }}>
          {cons.buy > 0 ? (
            <View style={{ width: pw(cons.buy), backgroundColor: C.up, justifyContent: "center", paddingLeft: 10 }}>
              <Text style={[T.mono(12, "700"), { color: C.ink }]}>{cons.buy}</Text>
            </View>
          ) : null}
          {cons.neu > 0 ? (
            <View style={{ width: pw(cons.neu), backgroundColor: C.line2, justifyContent: "center", alignItems: "center" }}>
              <Text style={[T.mono(12, "700"), { color: C.soft }]}>{cons.neu}</Text>
            </View>
          ) : null}
          {cons.sell > 0 ? (
            <View style={{ width: pw(cons.sell), backgroundColor: "rgba(255,107,91,0.6)", justifyContent: "center", alignItems: "flex-end", paddingRight: 10 }}>
              <Text style={[T.mono(12, "700"), { color: C.text }]}>{cons.sell}</Text>
            </View>
          ) : null}
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
          <Text style={[T.sans(11, "400"), { color: C.dim }]}>Achat</Text>
          <Text style={[T.sans(11, "400"), { color: C.dim }]}>Neutre</Text>
          <Text style={[T.sans(11, "400"), { color: C.dim }]}>Vente</Text>
        </View>
      </View>
    );
  }

  if (st.detailTab === "tech") {
    var shownRows = st.techCat === "Tous" ? s.tech : s.tech.filter(function (i) { return i.cat === st.techCat; });
    return (
      <View style={{ flex: 1 }}>
        {header}
        <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
          <Card>
            <Text style={[T.sans(22, "700"), { color: verdictColor, letterSpacing: -0.5 }]}>{cons.verdict}</Text>
            <Text style={[T.sans(12, "400"), { color: C.dim, marginTop: 4, marginBottom: 12 }]}>
              {cons.directional + " indicateurs directionnels · " + cons.info + " informatifs · horizon " + hLabel}
            </Text>
            {consensusBar()}
          </Card>
        </View>

        <View style={{ marginTop: 10 }}>
          <Chips items={CATS.map(function (c) { return { id: c, label: c }; })} value={st.techCat} onChange={function (c) { props.setState({ techCat: c }); }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20, gap: 6 }}>
          {shownRows.map(function (i) {
            var isInfo = i.sig === null || i.sig === undefined;
            var pillBg = isInfo ? "transparent" : i.sig > 0 ? C.upBg : i.sig < 0 ? C.downBg : C.flatBg;
            var pillCol = isInfo ? C.dim : i.sig > 0 ? C.up : i.sig < 0 ? C.down : C.soft;
            var pillTxt = isInfo ? "Info" : i.sig > 0 ? "Achat" : i.sig < 0 ? "Vente" : "Neutre";
            return (
              <View key={i.name} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 11, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 16 }}>
                <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                  <Text style={[T.sans(13, "600"), { color: C.text }]}>{i.name}</Text>
                  <Text style={[T.sans(11, "400"), { color: C.dim }]}>{i.cat}</Text>
                </View>
                <Text style={[T.mono(12, "600"), { color: C.soft }]}>{i.val}</Text>
                <View style={{ width: 62, alignItems: "center", paddingVertical: 6, borderRadius: 999, backgroundColor: pillBg, borderWidth: isInfo ? 1 : 0, borderColor: C.line2 }}>
                  <Text style={[T.sans(11, "600"), { color: pillCol }]}>{pillTxt}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  var fourchette = s.mc && s.mc.p05Pct != null
    ? (s.mc.p05Pct >= 0 ? "+" : "−") + Math.abs(s.mc.p05Pct).toFixed(1).replace(".", ",") + " / " + (s.mc.p95Pct >= 0 ? "+" : "−") + Math.abs(s.mc.p95Pct).toFixed(1).replace(".", ",") + " %"
    : s.interval;

  return (
    <View style={{ flex: 1 }}>
      {header}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24, gap: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10 }}>
          <Text style={[T.mono(34, "700"), { color: C.text, letterSpacing: -1.4 }]}>{s.price}</Text>
          <Text style={[T.mono(14, "600"), { color: s.changeRaw >= 0 ? C.up : C.down }]}>{s.change}</Text>
        </View>

        <Card style={{ paddingTop: 14, paddingBottom: 12 }}>
          <PriceChart width={chartW} color={color} history={s.history} p05={s.mc.p05} p95={s.mc.p95} median={s.mc.median} hLabel={hLabel} />
        </Card>

        <Card style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <Dial size={92} stroke={10} pct={s.score} color={color}>
            <Text style={[T.mono(22, "700"), { color: color, letterSpacing: -0.8 }]}>{s.score + " %"}</Text>
            <Text style={[T.sans(9.5, "400"), { color: C.dim }]}>{dir < 0 ? "baisse" : "hausse"}</Text>
          </Dial>
          <View style={{ flex: 1, gap: 9 }}>
            <Row k={"Attendu (" + hLabel + ")"} v={s.expected} color={color} />
            <Row k="Fourchette 90 %" v={fourchette} />
            <Row k="Fiabilité mesurée" v={s.conf} />
          </View>
        </Card>

        <PlanCard plan={plan} currency={s.currency} price={s.priceRaw} onPickHorizon={function (h) { setPlanH(h); }} />

        <Card style={{ gap: 12 }}>
          <Text style={[T.sans(15, "700"), { color: C.text }]}>Ce qui pèse dans le score</Text>
          {s.factors.map(function (f) {
            var pos = f[1] >= 0;
            var wd = Math.min(50, Math.abs(f[1]) / 2);
            var fc = f[1] === 0 ? C.dim : pos ? C.up : C.down;
            return (
              <View key={f[0]} style={{ gap: 6 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={[T.sans(12.5, "400"), { color: C.soft }]}>{f[0]}</Text>
                  <Text style={[T.mono(12.5, "600"), { color: fc }]}>{(pos ? "+" : "−") + Math.abs(f[1])}</Text>
                </View>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: C.card2 }}>
                  <View style={{ position: "absolute", left: "50%", top: -3, width: 1, height: 12, backgroundColor: "#3A4558" }} />
                  <View style={{ position: "absolute", top: 0, bottom: 0, borderRadius: 3, left: (pos ? 50 : 50 - wd) + "%", width: wd + "%", backgroundColor: fc }} />
                </View>
              </View>
            );
          })}
          <Text style={[T.sans(11, "400"), { color: C.dim }]}>
            {(s._model && s._model.source === "learned" ? "Modèle appris du " + (s._model.version || "") : "Modèle par défaut") + " · " + s.mc.scenarios.toLocaleString("fr-FR") + " scénarios"}
          </Text>
        </Card>

        <Pressable onPress={function () { props.setState({ detailTab: "tech" }); }} accessibilityRole="button">
          <Card style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ gap: 3 }}>
                <Text style={[T.sans(15, "700"), { color: C.text }]}>Analyse technique</Text>
                <Text style={[T.sans(12, "400"), { color: C.dim }]}>{cons.directional + " indicateurs directionnels"}</Text>
              </View>
              <Text style={[T.sans(12.5, "600"), { color: verdictColor }]}>{cons.verdict}</Text>
            </View>
            {consensusBar()}
          </Card>
        </Pressable>

        <Card style={{ gap: 12 }}>
          <Text style={[T.sans(15, "700"), { color: C.text }]}>{String(s.sectorLabel || "").replace(/^SECTEUR \/ /, "").toLowerCase().replace(/^./, function (c) { return c.toUpperCase(); })}</Text>
          <Text style={[T.sans(12.5, "400"), { color: C.dim, lineHeight: 19 }]}>{s.sector}</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Stat k="Volatilité" v={s.vol} size={14} />
            <Stat k="Bêta" v={s.beta} size={14} />
            <Stat k="Corrél." v={s.corr} size={14} />
          </View>
        </Card>

        <View style={{ gap: 10, marginTop: 4 }}>
          <Text style={[T.sans(17, "700"), { color: C.text, letterSpacing: -0.3 }]}>Actualités liées</Text>
          <NewsList items={news.items} loading={news.loading} error={news.error} limit={6} />
        </View>

        <Text style={[T.sans(11, "400"), { color: C.dim, textAlign: "center", lineHeight: 16, paddingHorizontal: 12 }]}>
          Information statistique — ne constitue pas un conseil en investissement.
        </Text>
      </ScrollView>
    </View>
  );
}
