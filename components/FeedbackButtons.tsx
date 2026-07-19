"use client";

import { useEffect, useState } from "react";
import { addFeedback, subscribeRecentFeedback, undoFeedback, type FeedbackEntry } from "@/lib/firebase/feedbackRepo";

/**
 * 要件定義書8章「フィードバック」：入力後は現在のオフセット値を表示し、
 * 直近入力を取り消す導線を設ける。UXレビュー指摘（結果の可視化・取り消し手段）に対応。
 */
export function FeedbackButtons({
  uid,
  outdoorTemp,
  currentOffset,
}: {
  uid: string;
  outdoorTemp: number;
  currentOffset: number;
}) {
  const [recent, setRecent] = useState<FeedbackEntry[]>([]);
  const [pending, setPending] = useState(false);

  useEffect(() => subscribeRecentFeedback(uid, 5, setRecent), [uid]);

  const latestActive = recent.find((entry) => !entry.deleted);

  const handleFeedback = async (signal: "hot" | "cold") => {
    setPending(true);
    try {
      await addFeedback(uid, signal, outdoorTemp);
    } finally {
      setPending(false);
    }
  };

  const handleUndo = async () => {
    if (!latestActive) return;
    setPending(true);
    try {
      await undoFeedback(uid, latestActive.id);
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="rounded-xl border border-black/10 p-6 dark:border-white/15">
      <p className="text-sm font-medium">感じ方を教えてください</p>
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => handleFeedback("hot")}
          className="flex-1 rounded-lg bg-orange-500/10 px-4 py-3 text-sm font-medium text-orange-700 hover:bg-orange-500/20 disabled:opacity-50 dark:text-orange-300"
        >
          今暑い
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => handleFeedback("cold")}
          className="flex-1 rounded-lg bg-blue-500/10 px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-500/20 disabled:opacity-50 dark:text-blue-300"
        >
          今寒い
        </button>
      </div>

      <p className="mt-3 text-xs text-black/60 dark:text-white/60">
        現在の個人オフセット：{currentOffset > 0 ? "+" : ""}
        {currentOffset.toFixed(1)}℃
      </p>

      {latestActive && (
        <button
          type="button"
          disabled={pending}
          onClick={handleUndo}
          className="mt-2 text-xs text-black/50 underline hover:text-black/70 disabled:opacity-50 dark:text-white/50 dark:hover:text-white/70"
        >
          直前の「{latestActive.signal === "hot" ? "今暑い" : "今寒い"}」を取り消す
        </button>
      )}
    </section>
  );
}
