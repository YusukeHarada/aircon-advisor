"use client";

import { useState } from "react";
import { saveUserSettings, DEFAULT_SETTINGS } from "@/lib/firebase/settingsRepo";
import { LOCATION_OPTIONS } from "@/lib/locations";

/**
 * 要件定義書8章「オンボーディング」：地点設定と個人オフセット初期値の説明を行う。
 * UXレビュー指摘（オンボーディング未定義）に対応。
 */
export function OnboardingForm({ uid }: { uid: string }) {
  const [locationCode, setLocationCode] = useState(LOCATION_OPTIONS[0].code);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await saveUserSettings(uid, { ...DEFAULT_SETTINGS, location: locationCode });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto max-w-md rounded-xl border border-black/10 p-6 dark:border-white/15">
      <h1 className="text-lg font-bold">ようこそ</h1>
      <p className="mt-2 text-sm text-black/70 dark:text-white/70">
        その日の外気温・湿度から、エアコンの推奨設定温度を毎日お知らせします。
        操作はしません。表示された温度を目安に、手動でエアコンを設定してください。
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="location" className="block text-sm font-medium">
            お住まいの地域
          </label>
          <select
            id="location"
            value={locationCode}
            onChange={(e) => setLocationCode(e.target.value)}
            className="mt-1 w-full rounded-lg border border-black/15 bg-transparent p-2 text-sm dark:border-white/20"
          >
            {LOCATION_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <p className="text-xs text-black/60 dark:text-white/60">
          寒がり・暑がりの度合いは初期状態では「普通」に設定されます。使いながら「今暑い／今寒い」で調整できます。
        </p>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {saving ? "設定中..." : "はじめる"}
        </button>
      </form>
    </section>
  );
}
