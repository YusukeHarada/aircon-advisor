export type FeedbackSignal = "hot" | "cold";

/** 5.7 個人オフセットを許容範囲内にクランプする */
export function clampOffset(offset: number, range: { min: number; max: number }): number {
  return Math.min(range.max, Math.max(range.min, offset));
}

/** 5.7 最終設定温度に個人オフセットを加算する */
export function applyPersonalOffset(temp: number, offset: number): number {
  return temp + offset;
}

/**
 * 5.7 フィードバック入力（「暑い」「寒い」）の累積からオフセットを簡易調整する。
 * hot（暑い） → オフセットを下げる（-step）、cold（寒い） → オフセットを上げる（+step）。
 * 削除（取り消し）済みの入力は呼び出し側で除外してから渡すこと。
 */
export function computeOffsetFromFeedback(
  currentOffset: number,
  signals: FeedbackSignal[],
  step: number,
  range: { min: number; max: number },
): number {
  const delta = signals.reduce((sum, signal) => sum + (signal === "hot" ? -step : step), 0);
  return clampOffset(currentOffset + delta, range);
}
