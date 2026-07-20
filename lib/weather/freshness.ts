/**
 * キャッシュの鮮度判定（純粋関数、単体テスト対象）。
 * 要件定義書7章：キャッシュ更新頻度は1時間おきを目安とする（当初6時間おきとしていたが、
 * 気温の日内変化に追従できないため短縮した。気象庁アメダスAPIはAPIキー不要の公開
 * エンドポイントで明確なレート制限も示されていないため、個人利用規模では問題ない）。
 */
export function isCacheFresh(fetchedAt: Date, maxAgeMs: number, now: Date): boolean {
  return now.getTime() - fetchedAt.getTime() <= maxAgeMs;
}

export const CACHE_MAX_AGE_MS = 60 * 60 * 1000;
