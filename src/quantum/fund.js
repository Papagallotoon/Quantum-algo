import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Fondamentaux (PER, dividende, avis des analystes, date de resultats) et niveau
// habituel des probabilites par horizon, publies chaque matin par la routine.
var FUND_URL = "https://papagallotoon.github.io/Quantum-algo/fund.json";
var KEY = "qa.fund.v1";
var cache = null, pending = null, subs = [];

function publish(d) { cache = d; subs.forEach(function (fn) { fn(d); }); }

function load() {
  if (pending) return pending;
  pending = AsyncStorage.getItem(KEY).then(function (raw) {
    if (raw && !cache) { try { publish(JSON.parse(raw)); } catch (e) {} }
  }).catch(function () {}).then(function () {
    return fetch(FUND_URL + "?t=" + Math.floor(Date.now() / 3600000)).then(function (r) { return r.ok ? r.json() : null; });
  }).then(function (d) {
    if (d && d.f) { publish(d); AsyncStorage.setItem(KEY, JSON.stringify(d)).catch(function () {}); }
  }).catch(function () {});
  return pending;
}

export function useFund() {
  var [d, setD] = useState(cache);
  useEffect(function () {
    subs.push(setD);
    load();
    if (cache) setD(cache);
    return function () { subs = subs.filter(function (x) { return x !== setD; }); };
  }, []);
  return d;
}

export function baseOf(F, h) { return F && F.base && F.base[h] != null ? F.base[h] : null; }
