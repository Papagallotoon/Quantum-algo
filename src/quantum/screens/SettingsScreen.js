import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { C, T } from "../theme";
import { useBrain } from "../Brain";
import { Card, ScreenTitle, Segmented } from "../components/UI";
import Icon from "../components/Icons";

export default function SettingsScreen(props) {
  var st = props.state;
  var brain = useBrain();
  var nl = brain.model && brain.model.newsletter;
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 14 }}>
      <Pressable onPress={function () { props.setState({ tab: "market" }); }} accessibilityLabel="Retour"
        style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, alignItems: "center", justifyContent: "center" }}>
        <Icon name="back" size={18} width={2} color={C.text} />
      </Pressable>
      <ScreenTitle title="Réglages" />

      <Card style={{ gap: 12 }}>
        <Text style={[T.sans(15, "700"), { color: C.text }]}>Simulation Monte-Carlo</Text>
        <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
          <Text style={[T.sans(13, "400"), { color: C.soft }]}>Scénarios simulés</Text>
          <Text style={[T.mono(14, "700"), { color: C.brand }]}>{st.sims.toLocaleString("fr-FR")}</Text>
        </View>
        <Segmented items={[2000, 10000, 50000].map(function (n) { return { id: n, label: n.toLocaleString("fr-FR") }; })}
          value={st.sims} onChange={function (n) { props.setState({ sims: n }); }} />
        <Text style={[T.sans(12, "400"), { color: C.dim, lineHeight: 18 }]}>
          Près de 100 indicateurs (dont 82 directionnels) sont combinés par un modèle réentraîné chaque nuit ; la volatilité vient des 60 dernières séances, avec des queues de distribution épaisses.
        </Text>
      </Card>

      <Card style={{ gap: 8 }}>
        <Text style={[T.sans(15, "700"), { color: C.text }]}>Lettre du matin</Text>
        <Text style={[T.sans(13, "500"), { color: C.soft }]}>
          {nl && nl.lastSent ? "Dernière lettre envoyée le " + nl.lastSent : "Pas encore envoyée"}
        </Text>
        <Text style={[T.sans(12, "400"), { color: C.dim, lineHeight: 18 }]}>
          Chaque matin de semaine : tendance des indices, agenda économique, opportunités avec horizon, zone d'entrée, stop et objectif, valeurs à éviter et bilan de fiabilité. Inscription sur le site.
        </Text>
      </Card>

      <View style={{ backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, borderRadius: 22, padding: 16 }}>
        <Text style={[T.sans(12, "400"), { color: C.dim, lineHeight: 18 }]}>
          Données de marché Yahoo Finance, différées. Quantum Algo fournit des estimations statistiques de hausse et de baisse : l'application ne permet aucune transaction et ne constitue pas un conseil en investissement.
        </Text>
      </View>

      <Text style={[T.sans(11, "400"), { color: C.dimmer, textAlign: "center" }]}>Version 7.0 · modèle auto-évalué</Text>
    </ScrollView>
  );
}
