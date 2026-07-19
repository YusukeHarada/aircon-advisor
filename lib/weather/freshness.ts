/**
 * キャッシュの鮮度判定（純粋関数、単体テスト対象）。
 * 要件定義書7章：キャッシュ更新頻度は1日4回（6時間おき）を目安とする。
 */
export function isCacheFresh(fetchedAt: Date, maxAgeMs: number, now: Date): boolean {
  return now.getTime() - fetchedAt.getTime() <= maxAgeMs;
}

export const CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000;
