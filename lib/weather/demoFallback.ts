import type { WeatherSnapshot } from "./types";

/**
 * Firebase/気象庁いずれも利用できない環境（デモモード、またはネットワーク遮断時）向けの
 * 固定サンプル値。実在のデータではないことを呼び出し側で明示すること（status: "demo"）。
 */
export function getDemoWeatherSnapshot(): WeatherSnapshot {
  return {
    temp: 29.5,
    humidity: 62,
    fetchedAt: new Date(),
  };
}
