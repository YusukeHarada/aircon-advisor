import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { isFirebaseAdminConfigured } from "@/lib/firebase/config";
import { getWeatherWithCache } from "@/lib/weather/cache";
import { getDemoWeatherSnapshot } from "@/lib/weather/demoFallback";
import { JmaWeatherProvider } from "@/lib/weather/providers/jma";

const provider = new JmaWeatherProvider();

/**
 * サーバー側経由での気象データ取得（要件定義書7章・9章）。
 * APIキー不要な気象庁を利用しているが、クライアントから直接JMAを叩かせず
 * このルート経由に統一することで、将来キー必須なソースへの切り替えも
 * サーバー側の変更のみで完結させる。
 *
 * Firebase（Admin SDK）が未設定の場合はキャッシュを使わずJMAへ直接問い合わせ、
 * それも失敗する場合は固定のデモ値を返す。Firebaseプロジェクトの用意を
 * 後回しにしてもアプリの動作を確認できるようにするための措置。
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locationKey = searchParams.get("locationKey");

  if (!locationKey) {
    return NextResponse.json({ error: "locationKey is required" }, { status: 400 });
  }

  if (!isFirebaseAdminConfigured()) {
    try {
      const fetched = await provider.fetchCurrentWeather(locationKey);
      return NextResponse.json({
        status: "fetched",
        temp: fetched.temp,
        humidity: fetched.humidity,
        fetchedAt: fetched.fetchedAt.toISOString(),
      });
    } catch {
      const demo = getDemoWeatherSnapshot();
      return NextResponse.json({
        status: "demo",
        temp: demo.temp,
        humidity: demo.humidity,
        fetchedAt: demo.fetchedAt.toISOString(),
      });
    }
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
