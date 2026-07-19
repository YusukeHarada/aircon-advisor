"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SettingsForm } from "@/components/SettingsForm";
import { useAnonymousAuth } from "@/lib/firebase/useAnonymousAuth";
import { subscribeUserSettings, DEFAULT_SETTINGS, type UserSettings } from "@/lib/firebase/settingsRepo";

// 認証状態・Firestoreの購読に依存するため静的プリレンダリング対象から外す。
export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const auth = useAnonymousAuth();
  const uid = auth.status === "signed-in" ? auth.user.uid : null;
  const [settings, setSettings] = useState<UserSettings | null | "loading">("loading");

  useEffect(() => {
    if (!uid) return;
    return subscribeUserSettings(uid, setSettings);
  }, [uid]);

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

  return (
    <main className="mx-auto max-w-md space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">設定</h1>
        <Link href="/" className="text-sm text-black/60 underline dark:text-white/60">
          今日の推奨に戻る
        </Link>
      </div>

      <SettingsForm uid={uid} initialSettings={settings ?? DEFAULT_SETTINGS} />
    </main>
  );
}
