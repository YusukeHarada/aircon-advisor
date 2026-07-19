"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FeedbackButtons } from "@/components/FeedbackButtons";
import { OnboardingForm } from "@/components/OnboardingForm";
import { RecommendationCard } from "@/components/RecommendationCard";
import { useAnonymousAuth } from "@/lib/firebase/useAnonymousAuth";
import { subscribeUserSettings, type UserSettings } from "@/lib/firebase/settingsRepo";
import { useWeather } from "@/lib/hooks/useWeather";
import { DEFAULT_PARAMETERS } from "@/lib/recommendation/constants";
import { recommend } from "@/lib/recommendation/recommend";

// 認証状態・Firestoreの購読に依存するため静的プリレンダリング対象から外す。
export const dynamic = "force-dynamic";

export default function Home() {
  const auth = useAnonymousAuth();
  const [settings, setSettings] = useState<UserSettings | null | "loading">("loading");
  const uid = auth.status === "signed-in" ? auth.user.uid : null;

  useEffect(() => {
    if (!uid) return;
    return subscribeUserSettings(uid, setSettings);
  }, [uid]);

  const locationKey = settings && settings !== "loading" ? settings.location : null;
  const weather = useWeather(locationKey);

  if (auth.status === "loading") {
    return <main className="mx-auto max-w-md p-6 text-sm text-black/60 dark:text-white/60">読み込み中...</main>;
  }

  if (auth.status === "error" || !uid) {
    return (
      <main className="mx-auto max-w-md p-6 text-sm text-red-600">
        サインインに失敗しました。時間をおいて再度お試しください。
      </main>
    );
  }

  if (settings === "loading") {
    return <main className="mx-auto max-w-md p-6 text-sm text-black/60 dark:text-white/60">読み込み中...</main>;
  }

  if (!settings) {
    return (
      <main className="mx-auto max-w-md p-6">
        <OnboardingForm uid={uid} />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">今日の推奨</h1>
        <Link href="/settings" className="text-sm text-black/60 underline dark:text-white/60">
          設定
        </Link>
      </div>

      {weather.phase === "loading" && (
        <p className="text-sm text-black/60 dark:text-white/60">気象データを取得しています...</p>
      )}

      {weather.phase === "unavailable" && (
        <p className="rounded-xl border border-red-300 p-4 text-sm text-red-600 dark:border-red-700">
          気象データを取得できませんでした。時間をおいて再度お試しください。
        </p>
      )}

      {weather.phase === "error" && (
        <p className="rounded-xl border border-red-300 p-4 text-sm text-red-600 dark:border-red-700">
          {weather.message}
        </p>
      )}

      {weather.phase === "ready" &&
        (() => {
          const params = {
            ...DEFAULT_PARAMETERS,
            comfortDiTarget: settings.comfortDiTarget,
            indoorHumidity: settings.indoorHumidity,
          };
          const recommendation = recommend(
            { outdoorTemp: weather.data.temp, outdoorHumidity: weather.data.humidity },
            settings.offset,
            params,
          );

          return (
            <>
              <RecommendationCard recommendation={recommendation} weather={weather.data} />
              <FeedbackButtons uid={uid} outdoorTemp={weather.data.temp} currentOffset={settings.offset} />
            </>
          );
        })()}
    </main>
  );
}
