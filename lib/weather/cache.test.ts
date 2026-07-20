import { describe, expect, it, vi } from "vitest";
import { getWeatherWithCache } from "./cache";
import type { WeatherProvider, WeatherSnapshot } from "./types";

/**
 * firebase-admin の Firestore を実インスタンスなしでテストするための最小限のフェイク。
 * cache.ts が実際に呼び出すチェーン（collection/doc/orderBy/limit/get/set）のみ実装する。
 */
function createFakeDb(initialEntries: { temp: number; humidity: number; fetched_at: Date }[] = []) {
  const entries = [...initialEntries];
  const writes: { temp: number; humidity: number; fetched_at: Date }[] = [];

  const db = {
    collection: () => ({
      doc: () => ({
        collection: () => ({
          orderBy: () => ({
            limit: () => ({
              get: async () => {
                const sorted = [...entries].sort((a, b) => b.fetched_at.getTime() - a.fetched_at.getTime());
                const latest = sorted[0];
                return {
                  empty: !latest,
                  docs: latest
                    ? [
                        {
                          data: () => ({
                            temp: latest.temp,
                            humidity: latest.humidity,
                            fetched_at: { toDate: () => latest.fetched_at },
                          }),
                        },
                      ]
                    : [],
                };
              },
            }),
          }),
          doc: () => ({
            set: async (value: { temp: number; humidity: number; fetched_at: Date }) => {
              writes.push(value);
              entries.push(value);
            },
          }),
        }),
      }),
    }),
  };

  return { db, writes };
}

function fakeProvider(result: WeatherSnapshot | Error): WeatherProvider {
  return {
    fetchCurrentWeather: vi.fn(async () => {
      if (result instanceof Error) throw result;
      return result;
    }),
  };
}

describe("getWeatherWithCache", () => {
  const locationKey = "44132"; // 東京のアメダスコード例

  it("新鮮なキャッシュがあればプロバイダを呼ばずに返す", async () => {
    const now = new Date("2026-07-19T12:00:00+09:00");
    const { db } = createFakeDb([{ temp: 30, humidity: 60, fetched_at: new Date("2026-07-19T11:30:00+09:00") }]);
    const provider = fakeProvider(new Error("should not be called"));

    // @ts-expect-error フェイクdbのため型を緩める
    const result = await getWeatherWithCache(db, provider, locationKey, now);

    expect(result).toEqual({
      status: "fresh",
      weather: { temp: 30, humidity: 60, fetchedAt: new Date("2026-07-19T11:30:00+09:00") },
    });
    expect(provider.fetchCurrentWeather).not.toHaveBeenCalled();
  });

  it("キャッシュが古ければプロバイダから再取得しキャッシュに書き込む", async () => {
    const now = new Date("2026-07-19T12:00:00+09:00");
    const { db, writes } = createFakeDb([
      { temp: 20, humidity: 50, fetched_at: new Date("2026-07-19T04:00:00+09:00") },
    ]);
    const fetched: WeatherSnapshot = { temp: 32, humidity: 65, fetchedAt: now };
    const provider = fakeProvider(fetched);

    // @ts-expect-error フェイクdbのため型を緩める
    const result = await getWeatherWithCache(db, provider, locationKey, now);

    expect(result).toEqual({ status: "fetched", weather: fetched });
    expect(writes).toHaveLength(1);
  });

  it("プロバイダ取得に失敗し古いキャッシュがあればstale-cacheで返す", async () => {
    const now = new Date("2026-07-19T12:00:00+09:00");
    const staleWeather = { temp: 18, humidity: 40, fetched_at: new Date("2026-07-19T04:00:00+09:00") };
    const { db } = createFakeDb([staleWeather]);
    const provider = fakeProvider(new Error("network error"));

    // @ts-expect-error フェイクdbのため型を緩める
    const result = await getWeatherWithCache(db, provider, locationKey, now);

    expect(result).toEqual({
      status: "stale-cache",
      weather: { temp: 18, humidity: 40, fetchedAt: staleWeather.fetched_at },
    });
  });

  it("キャッシュもプロバイダ取得もない場合はunavailable", async () => {
    const now = new Date("2026-07-19T12:00:00+09:00");
    const { db } = createFakeDb([]);
    const provider = fakeProvider(new Error("network error"));

    // @ts-expect-error フェイクdbのため型を緩める
    const result = await getWeatherWithCache(db, provider, locationKey, now);

    expect(result).toEqual({ status: "unavailable" });
  });
});
