import React from "react";
import { View, Text, ScrollView, RefreshControl, Pressable } from "react-native";
import { C, T } from "../theme";
import { INDEX_DEFS, COMPONENTS, INDEX_QUERY, newsQuery } from "../universe";
import { useNews } from "../useNews";
import NewsList from "../components/NewsList";
import SwipePager from "../components/SwipePager";
import { Chips, ScreenTitle } from "../components/UI";

export default function NewsScreen(props) {
  var st = props.state;
  var def = INDEX_DEFS.filter(function (i) { return i.id === st.index; })[0] || INDEX_DEFS[0];
  var queries = [INDEX_QUERY[st.index] || def.label + " bourse"]
    .concat((COMPONENTS[st.index] || []).slice(0, 4).map(newsQuery));
  var news = useNews(queries);

  var pos = INDEX_DEFS.findIndex(function (i) { return i.id === st.index; });
  if (pos < 0) pos = 0;

  function goTo(delta) {
    var next = (pos + delta + INDEX_DEFS.length) % INDEX_DEFS.length;
    props.setState({ index: INDEX_DEFS[next].id });
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
        <ScreenTitle title="Actualités" sub={def.label + " et ses principales valeurs"} />
      </View>

      <Chips items={INDEX_DEFS.map(function (i) { return { id: i.id, label: i.name === "NASDAQ" ? "Nasdaq" : i.name === "NIKKEI" ? "Nikkei" : i.name === "DOW" ? "Dow" : i.name }; })}
        value={st.index} onChange={function (id) { props.setState({ index: id }); }} />

      <SwipePager canPrev canNext onPrev={function () { goTo(-1); }} onNext={function () { goTo(1); }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={news.loading} onRefresh={news.refresh} tintColor={C.dim} />}
      >
        <NewsList items={news.items} loading={news.loading} error={news.error} />
        <Text style={[T.sans(11, "400"), { color: C.dim, textAlign: "center", marginTop: 16 }]}>
          Sources de presse françaises
        </Text>
      </ScrollView>
      </SwipePager>

    </View>
  );
}
