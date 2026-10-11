import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { C, T } from "../theme";
import Icon from "./Icons";
import { searchSymbols } from "../api/search";

export default function SearchBar(props) {
  var [q, setQ] = useState("");
  var [results, setResults] = useState([]);
  var [busy, setBusy] = useState(false);
  var [err, setErr] = useState(null);
  var timer = useRef(null);
  var alive = useRef(true);

  useEffect(function () {
    alive.current = true;
    return function () { alive.current = false; if (timer.current) clearTimeout(timer.current); };
  }, []);

  function onChange(text) {
    setQ(text);
    setErr(null);
    if (timer.current) clearTimeout(timer.current);
    if (text.trim().length < 1) { setResults([]); setBusy(false); return; }
    setBusy(true);
    // on attend une pause de frappe avant d'interroger le reseau
    timer.current = setTimeout(function () {
      searchSymbols(text)
        .then(function (r) { if (alive.current) { setResults(r); setBusy(false); } })
        .catch(function (e) { if (alive.current) { setErr(e.message || String(e)); setBusy(false); } });
    }, 280);
  }

  function clear() { setQ(""); setResults([]); setErr(null); setBusy(false); }
  function choose(r) { clear(); props.onSelect(r.symbol); }

  var open = q.trim().length >= 1;

  return (
    <View style={{ zIndex: 20 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, height: 48, backgroundColor: C.card, borderWidth: 1, borderColor: open ? C.brand : C.line, borderRadius: 16, paddingHorizontal: 14 }}>
        <Icon name="search" size={18} color={C.dim} />
        <TextInput
          value={q}
          onChangeText={onChange}
          placeholder="Une action, un ETF, un symbole…"
          placeholderTextColor={C.dimmer}
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Rechercher"
          style={[T.sans(14, "400"), { color: C.text, flex: 1, paddingVertical: 10 }]}
        />
        {busy ? <ActivityIndicator size="small" color={C.dim} /> : null}
        {q ? (
          <Pressable onPress={clear} hitSlop={12} accessibilityLabel="Effacer">
            <Icon name="close" size={16} color={C.dim} />
          </Pressable>
        ) : null}
      </View>

      {open ? (
        <View style={{ marginTop: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 16, overflow: "hidden" }}>
          {err ? (
            <Text style={[T.sans(12, "400"), { color: C.down, padding: 14 }]}>{err}</Text>
          ) : results.length === 0 && !busy ? (
            <Text style={[T.sans(12, "400"), { color: C.dim, padding: 14 }]}>Aucun résultat</Text>
          ) : (
            results.slice(0, 8).map(function (r, i) {
              return (
                <Pressable key={r.symbol} onPress={function () { choose(r); }}
                  style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12,
                    borderTopWidth: i === 0 ? 0 : 1, borderTopColor: C.borderSoft }}>
                  <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                    <Text style={[T.sans(13.5, "600"), { color: C.text }]} numberOfLines={1}>{r.name}</Text>
                    <Text style={[T.mono(11, "500"), { color: C.dim }]} numberOfLines={1}>{r.symbol + " · " + r.exchange}</Text>
                  </View>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: C.card2 }}>
                    <Text style={[T.sans(10.5, "600"), { color: C.soft }]}>{r.type}</Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      ) : null}
    </View>
  );
}
