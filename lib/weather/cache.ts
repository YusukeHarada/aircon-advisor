import type { Firestore } from "firebase-admin/firestore";
import { CACHE_MAX_AGE_MS, isCacheFresh } from "./freshness";
import type { WeatherProvider, WeatherSnapshot } from "./types";

const COLLECTION = "weather_cache";

interface CachedDoc {
  temp: number;
  humidity: number;
  fetched_at: FirebaseFirestore.Timestamp;
}

export type WeatherResult =
  | { status: "fresh" | "stale-cache" | "fetched"; weather: WeatherSnapshot }
  | { status: "unavailable" };

async function readLatestCache(db: Firestore, locationKey: string): Promise<WeatherSnapshot | null> {
  const snapshot = await db
    .collection(COLLECTION)
    .doc(locationKey)
    .collection("entries")
    .orderBy("fetched_at", "desc")
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0].data() as CachedDoc;
  return {
    temp: doc.temp,
    humidity: doc.humidity,
    fetchedAt: doc.fetched_at.toDate(),
  };
}

async function writeCache(db: Firestore, locationKey: string, weather: WeatherSnapshot): Promise<void> {
  await db
    .collection(COLLECTION)
    .doc(locationKey)
    .collection("entries")
    .doc(String(weather.fetchedAt.getTime()))
    .set({
      temp: weather.temp,
      humidity: weather.humidity,
      fetched_at: weather.fetchedAt,
    });
}

/**
 * 要件定義書7章のフォールバック順序を実装する。
 * 1. 新鮮なキャッシュがあればそれを使う
 * 2. 新鮮でなければプロバイダから再取得し、キャッシュを更新する
 * 3. 再取得に失敗した場合は古いキャッシュでもあればそれを使う（鮮度をstale-cacheで示す）
 * 4. キャッシュも取得も失敗したら unavailable を返す（呼び出し側で固定デフォルト値・エラー表示を判断）
 */
export async function getWeatherWithCache(
  db: Firestore,
  provider: WeatherProvider,
  locationKey: string,
  now: Date = new Date(),
  maxAgeMs: number = CACHE_MAX_AGE_MS,
): Promise<WeatherResult> {
  const cached = await readLatestCache(db, locationKey);

  if (cached && isCacheFresh(cached.fetchedAt, maxAgeMs, now)) {
    return { status: "fresh", weather: cached };
  }

  try {
    const fetched = await provider.fetchCurrentWeather(locationKey);
    await writeCache(db, locationKey, fetched);
    return { status: "fetched", weather: fetched };
  } catch {
    if (cached) {
      return { status: "stale-cache", weather: cached };
    }
    return { status: "unavailable" };
  }
}
