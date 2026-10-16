// Bilan : ce que le modele a reellement reussi, mesure chaque jour par le serveur.
// Aucun chiffre ici n'est invente : sans donnees du serveur, l'ecran le dit.

import React from "react";
import { View, Text, ScrollView, Pressable, RefreshControl, Linking } from "react-native";
import { C, T } from "../theme";
import { useBrain } from "../Brain";
import { HORIZON_KEYS, HORIZON_LABEL } from "../core/model.js";
import { Card, CardTitle, ScreenTitle, Segmented, Stat } from "../components/UI";
import Icon from "../components/Icons";
import { flagOf } from "../flags";

function pc(v) { return v == null || isNaN(v) ? "-" : (v * 100).toFixed(1).replace(".", ",") + " %"; }
function sp(v) { return v == null || isNaN(v) ? "-" : (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(2).replace(".", ",") + " %"; }
function rateColor(r) { return r == null ? C.dim : r >= 0.55 ? C.up : r >= 0.5 ? C.soft : C.down; }

function Bar(props) {
  var few = props.n != null && props.n < 20;
  var w = props.v == null || few ? 0 : Math.max(0, Math.min(100, ((props.v - 0.4) / 0.3) * 100));
  var col = few ? C.dim : rateColor(props.v);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <Text style={[T.mono(13, "600"), { color: C.text, width: 26 }]}>{props.k}</Text>
      <View style={{ flex: 1, height: 22, borderRadius: 7, backgroundColor: C.card2 }}>
        <View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: w + "%", borderRadius: 7, backgroundColor: col }} />
        <View style={{ position: "absolute", left: "33.3%", top: -4, bottom: -4, width: 2, backgroundColor: C.text, opacity: 0.5 }} />
      </View>
      <Text style={[T.mono(13, "700"), { color: col, width: 62, textAlign: "right" }]}>{few ? "mesure…" : pc(props.v)}</Text>
    </View>
  );
}

export default function TrustScreen(props) {
  var b = useBrain();
  var m = b.model, tr = b.track, sg = b.signals;
  var learned = m && m.source === "learned";
  var [busy, setBusy] = React.useState(false);
  var [mode, setMode] = React.useState("real");

  function reload() { setBusy(true); Promise.resolve(b.refresh()).finally(function () { setBusy(false); }); }
  var online = b.status === "en ligne";

  var bars = null;
  if (mode === "real") {
    bars = tr && tr.byHorizon ? HORIZON_KEYS.map(function (h) {
      var x = tr.byHorizon[h] || {};
      return <Bar key={h} k={h} v={x.nConf ? x.hitConf / x.nConf : null} n={x.nConf || 0} />;
    }) : (
      <Text style={[T.sans(12.5, "400"), { color: C.dim, lineHeight: 19 }]}>
        Pas encore de prévision arrivée à échéance. Les premiers résultats réels apparaissent le lendemain du premier passage du serveur (1 jour), puis après 1 semaine, 1 mois et 3 mois.
      </Text>
    );
  } else {
    bars = learned ? HORIZON_KEYS.map(function (h) {
      var o = m.horizons[h] && m.horizons[h].oos;
      return <Bar key={h} k={h} v={o ? (o.accConf != null ? o.accConf : o.acc) : null} n={o ? (o.nConf || o.n) : null} />;
    }) : <Text style={[T.sans(12.5, "400"), { color: C.dim, lineHeight: 19 }]}>Disponible après le premier entraînement du serveur.</Text>;
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={busy} onRefresh={reload} tintColor={C.dim} />}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 14 }}>
      <ScreenTitle title="Bilan" sub="Chaque nuit, le modèle vérifie ses prévisions arrivées à échéance et ne garde une nouvelle version que si elle fait mieux." />

      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.line }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: learned ? C.upBg : C.flatBg, alignItems: "center", justifyContent: "center" }}>
          <Icon name="refresh" size={20} width={2.2} color={learned ? C.up : C.soft} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[T.sans(14, "600"), { color: C.text }]}>{learned ? "Modèle appris du " + (m.version || "?") : "Modèle par défaut"}</Text>
          <Text style={[T.sans(12, "400"), { color: C.dim }]}>
            {online ? "Synchronisé avec le serveur" : b.status === "hors ligne" ? "Dernière version enregistrée (hors ligne)" : "Serveur pas encore joignable" + (b.error ? " (" + b.error + ")" : "")}
          </Text>
        </View>
        <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: online ? C.up : C.dim }} />
      </View>

      <Card style={{ gap: 14, borderRadius: 24 }}>
        <CardTitle sub="Bonnes directions quand le modèle avait un avis" style={{ marginBottom: 0 }}>{mode === "real" ? "En conditions réelles" : "Test historique (120 séances)"}</CardTitle>
        <Segmented items={[{ id: "real", label: "Réel" }, { id: "test", label: "Test historique" }]} value={mode} onChange={setMode} />
        <View style={{ gap: 14 }}>{bars}</View>
        {(mode === "real" ? tr && tr.byHorizon : learned) ? <View style={{ flexDirection: "row", justifyContent: "space-between", paddingLeft: 38, paddingRight: 74 }}>
          <Text style={[T.sans(10.5, "400"), { color: C.dim }]}>40 %</Text>
          <Text style={[T.sans(10.5, "400"), { color: C.dim }]}>50 % = hasard</Text>
          <Text style={[T.sans(10.5, "400"), { color: C.dim }]}>70 %</Text>
        </View> : null}
        {mode === "real" && tr && tr.pending != null ? (
          <Text style={[T.sans(11.5, "400"), { color: C.dim }]}>{tr.pending + " prévisions en attente d'échéance" + (tr.since ? " · suivi depuis le " + tr.since : "")}</Text>
        ) : null}
        <View style={{ flexDirection: "row", gap: 10, padding: 12, borderRadius: 14, backgroundColor: "rgba(139,147,255,0.08)" }}>
          <Icon name="info" size={16} width={2} color={C.brand} />
          <Text style={[T.sans(12, "400"), { color: C.soft, lineHeight: 18, flex: 1 }]}>En bourse, 53 à 56 % de bonnes directions de façon régulière est déjà un très bon résultat. Méfie-toi de tout outil qui annonce 70 % ou plus.</Text>
        </View>
      </Card>

      {sg && sg.picks && sg.picks.length ? (
        <Card style={{ borderRadius: 24, gap: 0 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <Text style={[T.sans(15, "700"), { color: C.text }]}>Sélection du jour</Text>
            <Text style={[T.sans(12, "400"), { color: C.dim }]}>{sg.dateLabel || sg.date || ""}</Text>
          </View>
          {sg.picks.map(function (p) {
            return (
              <Pressable key={p.sym + p.h} onPress={function () { props.open(p.sym); }} accessibilityRole="button"
                style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.borderSoft }}>
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <Text style={[T.sans(14, "600"), { color: C.text }]} numberOfLines={1}>{(flagOf(p.sym) ? flagOf(p.sym) + " " : "") + p.name}</Text>
                  <Text style={[T.sans(11.5, "400"), { color: C.dim }]}>{p.actionLabel + " · " + (HORIZON_LABEL[p.h] || p.h)}</Text>
                </View>
                <Text style={[T.mono(15, "700"), { color: C.up }]}>{Math.round(p.pUp * 100) + " %"}</Text>
                <Icon name="chev" size={16} width={2} color={C.dim} />
              </Pressable>
            );
          })}
        </Card>
      ) : null}

      {sg && (sg.brief || (sg.agenda && sg.agenda.today && sg.agenda.today.length) || (sg.news && sg.news.length)) ? (
        <Card style={{ borderRadius: 24, gap: 10 }}>
          <Text style={[T.sans(15, "700"), { color: C.text }]}>Aujourd'hui</Text>
          {(sg.brief || []).map(function (x, i) {
            return (
              <View key={"b" + i} style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, marginTop: 7, backgroundColor: C.brand }} />
                <Text style={[T.sans(12.5, "400"), { color: C.soft, lineHeight: 19, flex: 1 }]}>{x}</Text>
              </View>
            );
          })}
          {sg.agenda && sg.agenda.today && sg.agenda.today.length ? (
            <View style={{ gap: 6, marginTop: 4 }}>
              <Text style={[T.sans(12, "600"), { color: C.soft }]}>Agenda économique (heure de Paris)</Text>
              {sg.agenda.today.slice(0, 8).map(function (e, i) {
                return (
                  <View key={"a" + i} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 }}>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: C.upBg }}>
                      <Text style={[T.mono(11, "600"), { color: C.up }]}>{e.time}</Text>
                    </View>
                    <Text style={[T.sans(12.5, "500"), { color: C.text, flex: 1 }]}>{(e.flag || "") + " " + e.title}</Text>
                    <Text style={[T.sans(11, "600"), { color: e.impact === "fort" ? C.down : C.alert }]}>{e.impact}</Text>
                  </View>
                );
              })}
            </View>
          ) : null}
          {sg.earnings && sg.earnings.today && sg.earnings.today.length ? (
            <Text style={[T.sans(12.5, "500"), { color: C.text }]}>{"Résultats aujourd'hui : " + sg.earnings.today.map(function (e) { return e.name; }).join(", ")}</Text>
          ) : null}
          {sg.news && sg.news.length ? (
            <View style={{ marginTop: 4 }}>
              <Text style={[T.sans(12, "600"), { color: C.soft, marginBottom: 4 }]}>Actualités à surveiller</Text>
              {sg.news.slice(0, 6).map(function (n, i) {
                var c = n.tone === "positif" ? C.up : n.tone === "négatif" ? C.down : C.dim;
                return (
                  <Pressable key={"n" + i} onPress={function () { Linking.openURL(n.link).catch(function () {}); }} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.borderSoft }}>
                    <Text style={[T.sans(12.5, "500"), { color: C.text, lineHeight: 18 }]}>{n.title}</Text>
                    <Text style={[T.sans(11, "500"), { color: c, marginTop: 3 }]}>{(n.tone || "neutre") + " · " + (n.source || "")}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </Card>
      ) : null}

      {tr && tr.picks && tr.picks.length ? (
        <Card style={{ borderRadius: 24, gap: 12 }}>
          <Text style={[T.sans(15, "700"), { color: C.text }]}>Sélections arrivées à échéance</Text>
          {tr.picksSummary ? (
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Stat k="Rendement moyen" v={sp(tr.picksSummary.avg)} color={tr.picksSummary.avg >= 0 ? C.up : C.down} />
              <Stat k="Gagnantes" v={tr.picksSummary.winRate != null ? Math.round(tr.picksSummary.winRate * 100) + " %" : "-"} />
              <Stat k="Marché" v={sp(tr.picksSummary.benchAvg)} />
            </View>
          ) : null}
          {tr.picks.slice(0, 15).map(function (p, i) {
            return (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Text style={[T.mono(11, "500"), { color: C.dim, width: 44 }]}>{p.d}</Text>
                <Text style={[T.sans(13, "500"), { color: C.text, flex: 1 }]} numberOfLines={1}>{p.name + " (" + p.h + ")"}</Text>
                <Text style={[T.mono(13, "700"), { color: p.ret >= 0 ? C.up : C.down }]}>{sp(p.ret)}</Text>
              </View>
            );
          })}
        </Card>
      ) : null}

      {tr && tr.changes && tr.changes.length ? (
        <Card style={{ borderRadius: 24, gap: 6 }}>
          <Text style={[T.sans(15, "700"), { color: C.text, marginBottom: 4 }]}>Journal des améliorations</Text>
          {tr.changes.slice(0, 10).map(function (c, i) {
            return <Text key={i} style={[T.sans(12, "400"), { color: C.dim, lineHeight: 18 }]}>{"• " + c}</Text>;
          })}
        </Card>
      ) : null}
    </ScrollView>
  );
}
