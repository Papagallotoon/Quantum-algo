import React from "react";
import { View, Text, Pressable } from "react-native";
import { C, T } from "../theme";
import { HORIZON_KEYS, HORIZON_LABEL } from "../core/model.js";
import { frDate } from "../core/plan.js";
import { Stat } from "./UI";
import Icon from "./Icons";

function fr(v, d) { return v == null || isNaN(v) ? "-" : v.toFixed(d == null ? 2 : d).replace(".", ","); }
function pc(v) { return v == null || isNaN(v) ? "-" : Math.round(v * 100) + " %"; }

// Les cinq actions possibles regroupees en trois boutons lisibles
function group(a) {
  if (a === "ENTRER") return 0;
  if (a === "ATTENDRE_REPLI" || a === "ATTENDRE_CONFIRMATION" || a === "NEUTRE") return 1;
  return 2;
}
var BTN = [
  { label: "Entrer", bg: C.up, fg: C.ink },
  { label: "Attendre", bg: C.alert, fg: "#2A1C00" },
  { label: "Éviter", bg: C.down, fg: "#2A0A06" },
];

export default function PlanCard(props) {
  var p = props.plan, cur = props.currency === "EUR" ? " €" : props.currency === "USD" ? " $" : props.currency ? " " + props.currency : "";
  if (!p) return null;
  var g = group(p.action);
  var active = p.action === "ENTRER" || p.action === "ATTENDRE_REPLI" || p.action === "ATTENDRE_CONFIRMATION";
  var accent = g === 0 ? "rgba(52,211,153,0.35)" : g === 1 ? "rgba(245,183,64,0.35)" : "rgba(255,107,91,0.35)";

  // barre stop / entree / objectif, avec le cours actuel
  var bar = null;
  if (active && p.stop && p.target && p.zoneLo && p.zoneHi) {
    var lo = p.stop - (p.target - p.stop) * 0.1, hi = p.target + (p.target - p.stop) * 0.1, sp = hi - lo || 1;
    var x = function (v) { return Math.max(0, Math.min(100, (v - lo) / sp * 100)); };
    var price = props.price;
    bar = (
      <View style={{ gap: 10, paddingHorizontal: 12, paddingTop: 14, paddingBottom: 12, borderRadius: 16, backgroundColor: C.bg }}>
        <View style={{ height: 12, borderRadius: 6, backgroundColor: C.card2 }}>
          <View style={{ position: "absolute", left: x(p.stop) + "%", width: (x(p.zoneLo) - x(p.stop)) + "%", top: 0, bottom: 0, backgroundColor: "rgba(255,107,91,0.55)", borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }} />
          <View style={{ position: "absolute", left: x(p.zoneLo) + "%", width: Math.max(2, x(p.zoneHi) - x(p.zoneLo)) + "%", top: 0, bottom: 0, backgroundColor: C.brand }} />
          <View style={{ position: "absolute", left: x(p.zoneHi) + "%", width: (x(p.target) - x(p.zoneHi)) + "%", top: 0, bottom: 0, backgroundColor: "rgba(52,211,153,0.6)", borderTopRightRadius: 6, borderBottomRightRadius: 6 }} />
          {price ? <View style={{ position: "absolute", left: x(price) + "%", marginLeft: -1.5, top: -5, width: 3, height: 22, borderRadius: 2, backgroundColor: C.text }} /> : null}
        </View>
        <View style={{ flexDirection: "row" }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[T.sans(10.5, "400"), { color: C.dim }]}>Stop</Text>
            <Text style={[T.mono(13, "600"), { color: C.down }]}>{fr(p.stop) + cur}</Text>
            <Text style={[T.mono(10.5, "500"), { color: C.down }]}>{"−" + fr(p.riskPct, 1) + " %"}</Text>
          </View>
          <View style={{ flex: 1, gap: 2, alignItems: "center" }}>
            <Text style={[T.sans(10.5, "400"), { color: C.dim }]}>Entrée</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[T.mono(12, "600"), { color: C.brand }]}>{fr(p.zoneLo, p.zoneLo >= 100 ? 1 : 2) + "–" + fr(p.zoneHi, p.zoneHi >= 100 ? 1 : 2)}</Text>
          </View>
          <View style={{ flex: 1, gap: 2, alignItems: "flex-end" }}>
            <Text style={[T.sans(10.5, "400"), { color: C.dim }]}>Objectif</Text>
            <Text style={[T.mono(13, "600"), { color: C.up }]}>{fr(p.target) + cur}</Text>
            <Text style={[T.mono(10.5, "500"), { color: C.up }]}>{"+" + fr(p.gainPct, 1) + " %"}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: C.card, borderWidth: 1, borderColor: accent, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 18, gap: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={[T.sans(17, "700"), { color: C.text, letterSpacing: -0.3 }]}>Que faire ?</Text>
        <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9, backgroundColor: C.card2 }}>
          <Text style={[T.sans(11.5, "500"), { color: C.soft }]}>{"Horizon " + p.horizonLabel}</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 6 }}>
        {BTN.map(function (b, i) {
          var on = i === g;
          return (
            <View key={b.label} style={{ flex: 1, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6,
              backgroundColor: on ? b.bg : "transparent", borderWidth: on ? 0 : 1, borderColor: C.line2 }}>
              {on && i === 0 ? <Icon name="check" size={14} width={3} color={b.fg} /> : null}
              <Text style={[T.sans(13, on ? "700" : "500"), { color: on ? b.fg : C.dim }]}>{b.label}</Text>
            </View>
          );
        })}
      </View>

      <Text style={[T.sans(13.5, "400"), { color: C.soft, lineHeight: 20 }]}>
        {(function () { var t = String(p.start || p.actionLabel || "").trim(); if (t && !/[.!?]$/.test(t)) t += "."; return t + (active && p.validUntil ? " Ordre valable jusqu'au " + frDate(p.validUntil) + "." : ""); })()}
      </Text>

      {bar}

      {active ? (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Stat k="Gain / risque" v={fr(p.rr, 1) + "×"} size={16} />
            <Stat k="Objectif avant stop" v={pc(p.pTarget)} size={16} />
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Stat k="Garder" v={p.holdDays + " séances"} size={16} />
            <Stat k="Taille (1 % de risque)" v={fr(p.sizePct, 0) + " % du capital"} size={13} />
          </View>
        </View>
      ) : p.stop ? (
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Stat k="Protection si déjà détenu" v={fr(p.stop) + cur} color={C.down} />
          <Stat k="Réévaluer le" v={p.reviewDate ? frDate(p.reviewDate) : "-"} size={13} />
        </View>
      ) : null}

      {(p.why || []).length ? (
        <View style={{ gap: 8 }}>
          <Text style={[T.sans(12, "600"), { color: C.soft }]}>Pourquoi ?</Text>
          {p.why.map(function (w, i) {
            var neg = /prudence|attention|risque|baisse|faible|surachat|r[ée]sultats/i.test(w);
            return (
              <View key={i} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, marginTop: 7, backgroundColor: neg ? C.alert : C.up }} />
                <Text style={[T.sans(12.5, "400"), { color: C.dim, lineHeight: 19, flex: 1 }]}>{w}</Text>
              </View>
            );
          })}
        </View>
      ) : null}

      {p.evals ? (
        <View style={{ gap: 8, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 14 }}>
          <Text style={[T.sans(12, "600"), { color: C.soft }]}>Changer d'horizon</Text>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {HORIZON_KEYS.map(function (h) {
              var e = p.evals[h], on = h === p.horizon;
              var c2 = e.pUp >= 0.53 ? C.up : e.pUp <= 0.47 ? C.down : C.soft;
              return (
                <Pressable key={h} onPress={function () { if (props.onPickHorizon) props.onPickHorizon(h); }} accessibilityRole="button"
                  style={{ flex: 1, alignItems: "center", gap: 3, paddingVertical: 9, borderRadius: 12, borderWidth: 1,
                    borderColor: on ? C.brand : C.line, backgroundColor: on ? C.brandBg : "transparent" }}>
                  <Text style={[T.sans(11, "400"), { color: C.dim }]}>{h}</Text>
                  <Text style={[T.mono(15, "700"), { color: c2 }]}>{Math.round(e.pUp * 100) + "%"}</Text>
                  <Text style={[T.mono(10.5, "500"), { color: C.dim }]}>{(e.expPct >= 0 ? "+" : "") + fr(e.expPct, 1) + "%"}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[T.sans(11, "400"), { color: C.dim, lineHeight: 16 }]}>
            {"Chances de hausse sur 100 et variation attendue. " + (p.reliability ? "Fiabilité mesurée sur " + HORIZON_LABEL[p.horizon] + " : " + Math.round((p.reliability.accConf || p.reliability.acc) * 100) + " % de bonnes directions sur " + (p.reliability.nConf || p.reliability.n) + " cas récents." : "Fiabilité pas encore mesurée.")}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
