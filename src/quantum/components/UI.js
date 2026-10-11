import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { C, T } from "../theme";

export function Card(props) {
  return (
    <View style={[{ backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 22, padding: 16 }, props.style]}>
      {props.children}
    </View>
  );
}

export function ScreenTitle(props) {
  return (
    <View style={{ gap: 6, marginBottom: 2 }}>
      <Text style={[T.sans(28, "700"), { color: C.text, letterSpacing: -0.8 }]}>{props.title}</Text>
      {props.sub ? <Text style={[T.sans(13.5, "400"), { color: C.dim, lineHeight: 20 }]}>{props.sub}</Text> : null}
    </View>
  );
}

export function CardTitle(props) {
  return (
    <View style={[{ marginBottom: 10 }, props.style]}>
      <Text style={[T.sans(15, "700"), { color: C.text, letterSpacing: -0.2 }]}>{props.children}</Text>
      {props.sub ? <Text style={[T.sans(12, "400"), { color: C.dim, marginTop: 3, lineHeight: 17 }]}>{props.sub}</Text> : null}
    </View>
  );
}

// Rangee de puces (indices, categories) : la puce active est en indigo
export function Chips(props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: props.pad == null ? 20 : props.pad, gap: 8, alignItems: "center" }}
      style={{ flexGrow: 0, flexShrink: 0, height: 48 }}>
      {props.items.map(function (it) {
        var on = it.id === props.value;
        return (
          <Pressable key={it.id} onPress={function () { props.onChange(it.id); }}
            style={{ height: 40, paddingHorizontal: 16, borderRadius: 999, justifyContent: "center",
              backgroundColor: on ? C.brand : C.card, borderWidth: 1, borderColor: on ? C.brand : C.line2 }}>
            <Text style={[T.sans(13, "600"), { color: on ? C.brandInk : C.soft }]}>{it.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// Selecteur segmente (horizons, onglets)
export function Segmented(props) {
  return (
    <View style={[{ flexDirection: "row", gap: 4, padding: 4, borderRadius: 14, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line }, props.style]}>
      {props.items.map(function (it) {
        var on = it.id === props.value;
        return (
          <Pressable key={it.id} onPress={function () { props.onChange(it.id); }}
            style={{ flex: 1, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: on ? C.line : "transparent" }}>
            <Text style={[T.sans(13, "600"), { color: on ? C.text : C.dim }]}>{it.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Pill(props) {
  return (
    <View style={[{ alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: props.bg }, props.style]}>
      <Text style={[T.sans(12.5, "600"), { color: props.color }]}>{props.children}</Text>
    </View>
  );
}

export function Stat(props) {
  return (
    <View style={[{ flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 13, backgroundColor: C.card2, gap: 3 }, props.style]}>
      <Text style={[T.sans(10.5, "400"), { color: C.dim }]}>{props.k}</Text>
      <Text style={[T.mono(props.size || 15, "700"), { color: props.color || C.text }]} numberOfLines={1}>{props.v}</Text>
    </View>
  );
}
