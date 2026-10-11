import React, { useEffect } from "react";
import { View, Text, ScrollView } from "react-native";
import { C, T } from "../theme";
import { useMarketData } from "../MarketData";
import StockRow from "../components/StockRow";
import { ScreenTitle } from "../components/UI";

export default function WatchlistScreen(props) {
  var md = useMarketData();

  // les valeurs suivies hors indice courant doivent etre chargees pour s'afficher
  useEffect(function () {
    props.state.watch.forEach(function (sym) {
      if (!md.getAsset(sym) && !md.loading[sym] && !md.errors[sym]) md.loadSymbol(sym);
    });
  }, [props.state.watch.join(",")]);

  var items = props.state.watch
    .map(function (s) { return md.getAsset(s); })
    .filter(function (a) { return a && !a.error; });

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 14 }}>
      <ScreenTitle title="Ma liste" sub="Les valeurs que tu suis, avec leur estimation du jour." />
      {items.length === 0 ? (
        <View style={{ borderWidth: 1, borderColor: C.line2, borderStyle: "dashed", borderRadius: 22, paddingVertical: 34, paddingHorizontal: 24, alignItems: "center" }}>
          <Text style={[T.sans(14, "600"), { color: C.text, marginBottom: 7 }]}>Aucune valeur suivie</Text>
          <Text style={[T.sans(11.5, "400"), { color: C.dim, textAlign: "center", lineHeight: 17 }]}>
            Ouvre une valeur et touche « Suivre » en haut à droite pour l'ajouter ici.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {items.map(function (s) {
            return <StockRow key={s.id} stock={s} onPress={function () { props.open(s.id); }} />;
          })}
        </View>
      )}
    </ScrollView>
  );
}
