import type { WeatherProvider, WeatherSnapshot } from "../types";

const LATEST_TIME_URL = "https://www.jma.go.jp/bosai/amedas/data/latest_time.txt";

function toMapFileTimestamp(latestTimeIso: string): string {
  // JMAのタイムスタンプは常に "+09:00"(JST) で返る前提。実行サーバーのローカルタイムゾーンに
  // 依存させないよう、文字列から直接数値を取り出す（"2026-07-19T12:00:00+09:00" -> "20260719120000"）。
  const match = latestTimeIso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (!match) {
    throw new Error(`Unexpected JMA timestamp format: ${latestTimeIso}`);
  }
  const [, year, month, day, hour, minute, second] = match;
  return `${year}${month}${day}${hour}${minute}${second}`;
}

interface AmedasPointValue {
  temp?: [number, number];
  humidity?: [number, number];
}

/**
 * 気象庁アメダスの非公式JSON APIを利用した実装（要件定義書7章）。
 *
 * NOTE: このネットワーク環境からは www.jma.go.jp への到達性を検証できなかったため、
 * 一般に知られている公開URL・レスポンス形式（latest_time.txt → map/{timestamp}.json）
 * を前提に実装している。デプロイ前に実エンドポイントへの疎通とレスポンス形式を
 * 必ず確認すること（docs/requirements.md 7章の運用注記に対応）。
 */
export class JmaWeatherProvider implements WeatherProvider {
  async fetchCurrentWeather(amedasCode: string): Promise<WeatherSnapshot> {
    const latestTimeRes = await fetch(LATEST_TIME_URL, { cache: "no-store" });
    if (!latestTimeRes.ok) {
      throw new Error(`JMA latest_time fetch failed: ${latestTimeRes.status}`);
    }
    const latestTimeIso = (await latestTimeRes.text()).trim();
    const fileTimestamp = toMapFileTimestamp(latestTimeIso);

    const mapUrl = `https://www.jma.go.jp/bosai/amedas/data/map/${fileTimestamp}.json`;
    const mapRes = await fetch(mapUrl, { cache: "no-store" });
    if (!mapRes.ok) {
      throw new Error(`JMA amedas map fetch failed: ${mapRes.status}`);
    }
    const map = (await mapRes.json()) as Record<string, AmedasPointValue>;
    const point = map[amedasCode];
    if (!point || point.temp === undefined || point.humidity === undefined) {
      throw new Error(`JMA amedas data not found for code: ${amedasCode}`);
    }

    return {
      temp: point.temp[0],
      humidity: point.humidity[0],
      fetchedAt: new Date(latestTimeIso),
    };
  }
}
