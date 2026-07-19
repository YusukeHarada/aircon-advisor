import type { WeatherProvider, WeatherSnapshot } from "../types";

const LATEST_TIME_URL = "https://www.jma.go.jp/bosai/amedas/data/latest_time.txt";

function toMapFileTimestamp(latestTimeIso: string): string {
  // JMAのタイムスタンプは常に "+09:00"(JST) で返る前提。実行サーバーのローカルタイムゾーンに
  // 依存させないよう、文字列から直接数値を取り出す。map エンドポイントのファイル名は
  // 分単位（秒は常に "00"）の "YYYYMMDDHHMM00" 形式（"2026-07-19T12:00:00+09:00" -> "20260719120000"）。
  const match = latestTimeIso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) {
    throw new Error(`Unexpected JMA timestamp format: ${latestTimeIso}`);
  }
  const [, year, month, day, hour, minute] = match;
  return `${year}${month}${day}${hour}${minute}00`;
}

interface AmedasPointValue {
  temp?: [number, number];
  humidity?: [number, number];
}

/**
 * 気象庁アメダスの非公式JSON APIを利用した実装（要件定義書7章）。
 *
 * URL形式・レスポンス構造（latest_time.txt が返すISO時刻 → map/{YYYYMMDDHHMM00}.json、
 * 観測所番号をキーに temp/humidity が [値, 品質コード] の配列で入る）は公開情報で裏取り済み。
 * ただしこの開発環境からは www.jma.go.jp への実際の疎通確認はできていないため、
 * デプロイ後に一度実データが取得できることを確認すること。
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
