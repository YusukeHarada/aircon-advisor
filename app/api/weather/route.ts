import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { getWeatherWithCache } from "@/lib/weather/cache";
import { JmaWeatherProvider } from "@/lib/weather/providers/jma";

const provider = new JmaWeatherProvider();

/**
 * サーバー側経由での気象データ取得（要件定義書7章・9章）。
 * APIキー不要な気象庁を利用しているが、クライアントから直接JMAを叩かせず
 * このルート経由に統一することで、将来キー必須なソースへの切り替えも
 * サーバー側の変更のみで完結させる。
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locationKey = searchParams.get("locationKey");

  if (!locationKey) {
    return NextResponse.json({ error: "locationKey is required" }, { status: 400 });
  }

  const db = getAdminDb();
  const result = await getWeatherWithCache(db, provider, locationKey);

  if (result.status === "unavailable") {
    return NextResponse.json({ error: "weather data unavailable" }, { status: 503 });
  }

  return NextResponse.json({
    status: result.status,
    temp: result.weather.temp,
    humidity: result.weather.humidity,
    fetchedAt: result.weather.fetchedAt.toISOString(),
  });
}
