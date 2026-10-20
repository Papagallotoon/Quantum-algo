import React, { useEffect } from "react";
import { View, Text, ScrollView } from "react-native";
import { C, T } from "../theme";
import { useMarketData } from "../MarketData";
import StockRow from "../components/StockRow";
import { ScreenTitle } from "../components/UI";
import Icon from "../components/Icons";

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
      <ScreenTitle title="Mes valeurs" sub={props.state.watch.length ? props.state.watch.length + (props.state.watch.length > 1 ? " valeurs suivies" : " valeur suivie") + ", avec leur estimation du jour." : "Les valeurs que tu suis, avec leur estimation du jour."} />
      {items.length === 0 && props.state.watch.length > 0 ? (
        <Text style={[T.sans(12.5, "400"), { color: C.dim, textAlign: "center", marginTop: 20 }]}>Chargement de tes valeurs…</Text>
      ) : items.length === 0 ? (
        <View style={{ borderWidth: 1, borderColor: C.line2, borderStyle: "dashed", borderRadius: 22, paddingVertical: 34, paddingHorizontal: 24, alignItems: "center" }}>
          <Icon name="heart" size={30} width={1.8} color={C.heart} />
          <Text style={[T.sans(14, "600"), { color: C.text, marginBottom: 7, marginTop: 10 }]}>Aucune valeur suivie</Text>
          <Text style={[T.sans(11.5, "400"), { color: C.dim, textAlign: "center", lineHeight: 17 }]}>
            Touche le cœur à côté d'une valeur, dans Marchés ou sur sa fiche, pour la retrouver ici.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {items.map(function (s) {
            return <StockRow key={s.id} stock={s} onPress={function () { props.open(s.id); }}
                  watched={props.state.watch.indexOf(s.id) >= 0} onToggle={function () { props.toggleWatch(s.id); }} />;
          })}
        </View>
      )}
    </ScrollView>
  );
}
