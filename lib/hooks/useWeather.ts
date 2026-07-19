"use client";

import { useEffect, useState } from "react";

export type WeatherFetchStatus = "fresh" | "stale-cache" | "fetched";

export interface WeatherData {
  temp: number;
  humidity: number;
  fetchedAt: Date;
  status: WeatherFetchStatus;
}

export type WeatherState =
  | { phase: "idle" | "loading" }
  | { phase: "ready"; data: WeatherData }
  | { phase: "unavailable" }
  | { phase: "error"; message: string };

/**
 * 要件定義書8章「データ取得時刻（鮮度）表示」「取得失敗時のフォールバック」に対応。
 * サーバー側API Route（/api/weather）経由でのみ取得する（7章・9章）。
 */
export function useWeather(locationKey: string | null): WeatherState {
  const [state, setState] = useState<WeatherState>({ phase: locationKey ? "loading" : "idle" });

  // locationKey が変わったら即座に loading/idle へ切り替える（レンダー中の同期setStateは
  // Reactが「propsの変化に応じた状態リセット」として公式に許容するパターン）。
  // 実際のfetchと、それに伴う非同期のsetStateは以下のuseEffectのコールバック内でのみ行う。
  const [syncedLocationKey, setSyncedLocationKey] = useState(locationKey);
  if (locationKey !== syncedLocationKey) {
    setSyncedLocationKey(locationKey);
    setState({ phase: locationKey ? "loading" : "idle" });
  }

  useEffect(() => {
    if (!locationKey) return;

    let cancelled = false;

    fetch(`/api/weather?locationKey=${encodeURIComponent(locationKey)}`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 503) {
          setState({ phase: "unavailable" });
          return;
        }
        if (!res.ok) {
          setState({ phase: "error", message: `気象データの取得に失敗しました（${res.status}）` });
          return;
        }
        const json = (await res.json()) as { temp: number; humidity: number; fetchedAt: string; status: WeatherFetchStatus };
        setState({
          phase: "ready",
          data: { temp: json.temp, humidity: json.humidity, fetchedAt: new Date(json.fetchedAt), status: json.status },
        });
      })
      .catch(() => {
        if (!cancelled) setState({ phase: "error", message: "気象データの取得に失敗しました" });
      });

    return () => {
      cancelled = true;
    };
  }, [locationKey]);

  return state;
}
