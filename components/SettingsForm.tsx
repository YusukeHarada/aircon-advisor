"use client";

import { useState } from "react";
import { saveUserSettings, type UserSettings } from "@/lib/firebase/settingsRepo";
import { LOCATION_OPTIONS } from "@/lib/locations";

export function SettingsForm({ uid, initialSettings }: { uid: string; initialSettings: UserSettings }) {
  const [form, setForm] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Firestoreからの再購読で initialSettings の参照が変わった場合、編集中でなければ最新値に合わせる。
  // レンダー中の同期setStateはReactが公式に許容するパターン（エフェクト経由の非同期反映を避ける）。
  const [syncedSettings, setSyncedSettings] = useState(initialSettings);
  if (initialSettings !== syncedSettings) {
    setSyncedSettings(initialSettings);
    setForm(initialSettings);
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await saveUserSettings(uid, form);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="location" className="block text-sm font-medium">
          お住まいの地域
        </label>
        <select
          id="location"
          value={form.location ?? LOCATION_OPTIONS[0].code}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          className="mt-1 w-full rounded-lg border border-black/15 bg-transparent p-2 text-sm dark:border-white/20"
        >
          {LOCATION_OPTIONS.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="offset" className="block text-sm font-medium">
          寒がり／暑がりオフセット（℃）
        </label>
        <p className="mt-1 text-xs text-black/60 dark:text-white/60">
          マイナスなら涼しめ、プラスなら暖かめの設定になります。「今暑い／今寒い」フィードバックでも自動調整されます。
        </p>
        <input
          id="offset"
          type="number"
          step={0.5}
          min={-2}
          max={2}
          value={form.offset}
          onChange={(e) => setForm({ ...form, offset: Number(e.target.value) })}
          className="mt-2 w-full rounded-lg border border-black/15 bg-transparent p-2 text-sm dark:border-white/20"
        />
      </div>

      <div>
        <label htmlFor="comfortDi" className="block text-sm font-medium">
          快適さの目標値（目標室内不快指数）
        </label>
        <p className="mt-1 text-xs text-black/60 dark:text-white/60">
          値を下げるとより涼しめ・上げるとより控えめな冷房設定になります（初期値71）。
        </p>
        <input
          id="comfortDi"
          type="number"
          step={1}
          value={form.comfortDiTarget}
          onChange={(e) => setForm({ ...form, comfortDiTarget: Number(e.target.value) })}
          className="mt-2 w-full rounded-lg border border-black/15 bg-transparent p-2 text-sm dark:border-white/20"
        />
      </div>

      <div>
        <label htmlFor="indoorHumidity" className="block text-sm font-medium">
          想定室内湿度（%）
        </label>
        <p className="mt-1 text-xs text-black/60 dark:text-white/60">冷房時の室内湿度の見込み値です（初期値55%）。</p>
        <input
          id="indoorHumidity"
          type="number"
          step={1}
          value={form.indoorHumidity}
          onChange={(e) => setForm({ ...form, indoorHumidity: Number(e.target.value) })}
          className="mt-2 w-full rounded-lg border border-black/15 bg-transparent p-2 text-sm dark:border-white/20"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {saving ? "保存中..." : "保存する"}
      </button>

      {saved && <p className="text-sm text-green-600 dark:text-green-400">保存しました。</p>}
    </form>
  );
}
