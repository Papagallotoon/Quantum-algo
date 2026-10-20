import React, { useState, useCallback, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BrainProvider } from "./Brain";
import TrustScreen from "./screens/TrustScreen";
import { View, Text, Pressable, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { C, T } from "./theme";
import { MarketDataProvider } from "./MarketData";
import MarketScreen from "./screens/MarketScreen";
import DetailScreen from "./screens/DetailScreen";
import WatchlistScreen from "./screens/WatchlistScreen";
import NewsScreen from "./screens/NewsScreen";
import LexiconScreen from "./screens/LexiconScreen";
import SettingsScreen from "./screens/SettingsScreen";

import Icon from "./components/Icons";
import { loadAsync } from "expo-font";
import { FONTS, FONT_FILES } from "./theme";

var TABS = [
  { id: "market", label: "Marchés", icon: "markets" },
  { id: "news", label: "Actus", icon: "news" },
  { id: "watch", label: "Mes valeurs", icon: "heart" },
  { id: "trust", label: "Bilan", icon: "bilan" },
  { id: "lexicon", label: "Apprendre", icon: "learn" },
];

function Shell(props) {
  var state = props.state, setState = props.setState;
  var activeTab = state.tab === "detail" ? (state.from || "market") : state.tab === "settings" ? "market" : state.tab;

  var body = null;
  if (state.tab === "market") body = <MarketScreen {...props} />;
  else if (state.tab === "detail") body = <DetailScreen {...props} />;
  else if (state.tab === "watch") body = <WatchlistScreen {...props} />;
  else if (state.tab === "news") body = <NewsScreen {...props} />;
  else if (state.tab === "lexicon") body = <LexiconScreen {...props} />;
  else if (state.tab === "settings") body = <SettingsScreen {...props} />;
  else if (state.tab === "trust") body = <TrustScreen {...props} />;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: 8 }}>{body}</View>
      </SafeAreaView>
      <SafeAreaView edges={["bottom"]} style={{ backgroundColor: "rgba(13,17,25,0.97)", borderTopWidth: 1, borderTopColor: C.line }}>
        <View style={{ flexDirection: "row", paddingHorizontal: 8, paddingTop: 6, paddingBottom: 4 }}>
          {TABS.map(function (t) {
            var on = t.id === activeTab;
            var col = on ? C.brand : C.dim;
            return (
              <Pressable key={t.id} accessibilityRole="button" accessibilityLabel={t.label}
                onPress={function () { setState({ tab: t.id, detail: t.id === "market" ? null : state.detail }); }}
                style={{ flex: 1, height: 56, alignItems: "center", justifyContent: "center", gap: 5 }}>
                <Icon name={t.icon} color={col} width={on ? 2 : 1.8} />
                <Text style={[T.sans(10.5, on ? "600" : "500"), { color: col }]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}

export default function QuantumApp() {
  var [state, setStateRaw] = useState({
    tab: "market",
    index: "cac",
    horizon: "1S",
    sims: 10000,
    detail: null,
    detailTab: "est",
    techCat: "Tous",
    sortByScore: true,
    watch: [],
    from: "market",
  });

  // memorisation de la liste suivie et des reglages entre deux ouvertures
  var PREFS = "qa.prefs.v1";
  var loaded = useRef(false);
  useEffect(function () {
    AsyncStorage.getItem(PREFS).then(function (raw) {
      if (raw) {
        try {
          var p = JSON.parse(raw);
          setStateRaw(function (prev) {
            return Object.assign({}, prev, {
              watch: Array.isArray(p.watch) ? p.watch : prev.watch,
              horizon: p.horizon || prev.horizon,
              sims: p.sims || prev.sims,
              index: p.index || prev.index,
            });
          });
        } catch (e) {}
      }
    }).catch(function () {}).finally(function () { loaded.current = true; });
  }, []);
  useEffect(function () {
    if (!loaded.current) return;
    AsyncStorage.setItem(PREFS, JSON.stringify({ watch: state.watch, horizon: state.horizon, sims: state.sims, index: state.index })).catch(function () {});
  }, [state.watch, state.horizon, state.sims, state.index]);

  // polices de la refonte : on attend au plus 2,5 s, sinon polices systeme
  var [fontsOk, setFontsOk] = useState(false);
  useEffect(function () {
    var done = false;
    var finish = function (ok) { if (done) return; done = true; FONTS.ready = ok; setFontsOk(true); };
    var t = setTimeout(function () { finish(false); }, 2500);
    loadAsync(FONT_FILES).then(function () { clearTimeout(t); finish(true); }).catch(function () { clearTimeout(t); finish(false); });
    return function () { clearTimeout(t); };
  }, []);

  var setState = useCallback(function (patch) {
    setStateRaw(function (prev) { return Object.assign({}, prev, patch); });
  }, []);

  var open = useCallback(function (id) {
    setStateRaw(function (prev) {
      return Object.assign({}, prev, { detail: id, tab: "detail", detailTab: "est", from: prev.tab === "detail" ? prev.from : prev.tab });
    });
  }, []);

  var back = useCallback(function () {
    setStateRaw(function (prev) { return Object.assign({}, prev, { tab: prev.from || "market", detail: null }); });
  }, []);

  var toggleWatch = useCallback(function (id) {
    setStateRaw(function (prev) {
      var has = prev.watch.indexOf(id) >= 0;
      return Object.assign({}, prev, {
        watch: has ? prev.watch.filter(function (x) { return x !== id; }) : prev.watch.concat([id]),
      });
    });
  }, []);

  var shared = { state: state, setState: setState, open: open, back: back, toggleWatch: toggleWatch };

  if (!fontsOk) return <View style={{ flex: 1, backgroundColor: C.bg }} />;

  return (
    <BrainProvider>
      <MarketDataProvider horizon={state.horizon} sims={state.sims}>
        <Shell {...shared} />
      </MarketDataProvider>
    </BrainProvider>
  );
}
