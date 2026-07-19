import type { Recommendation } from "@/lib/recommendation/types";
import { MODE_LABELS, explainReason } from "@/lib/recommendation/explain";
import type { WeatherData, WeatherFetchStatus } from "@/lib/hooks/useWeather";

const FRESHNESS_LABELS: Record<WeatherFetchStatus, string> = {
  fresh: "",
  fetched: "",
  "stale-cache": "（気象データの取得に失敗したため、少し前のデータを表示しています）",
};

function formatTemp(temp: number | null): string {
  if (temp === null) return "—";
  return `${temp.toFixed(1)}℃`;
}

export function RecommendationCard({
  recommendation,
  weather,
}: {
  recommendation: Recommendation;
  weather: WeatherData;
}) {
  const hasSetTemp = recommendation.mainSetTemp !== null;

  return (
    <section className="rounded-xl border border-black/10 p-6 dark:border-white/15">
      <p className="text-sm text-black/60 dark:text-white/60">
        外気温 {weather.temp.toFixed(1)}℃ ／ 湿度 {weather.humidity.toFixed(0)}%
        <br />
        最終更新：{weather.fetchedAt.toLocaleString("ja-JP")}
        {FRESHNESS_LABELS[weather.status]}
      </p>

      <p className="mt-4 text-2xl font-bold">{MODE_LABELS[recommendation.mode]}</p>

      {hasSetTemp && (
        <p className="mt-1 text-4xl font-bold">
          {formatTemp(recommendation.mainSetTemp)}
          <span className="ml-2 text-base font-normal text-black/60 dark:text-white/60">を目安に設定</span>
        </p>
      )}

      <p className="mt-3 text-sm text-black/70 dark:text-white/70">{explainReason(recommendation.reason)}</p>

      {hasSetTemp && (
        <p className="mt-4 rounded-lg bg-black/5 p-3 text-sm dark:bg-white/10">
          この推奨温度を目安に、手動でエアコンを設定してください。
        </p>
      )}

      {recommendation.energySavingSetTemp !== null && (
        <p className="mt-4 rounded-lg border border-dashed border-black/20 p-3 text-sm text-black/60 dark:border-white/25 dark:text-white/60">
          省エネ重視なら {formatTemp(recommendation.energySavingSetTemp)} も選択肢です。
        </p>
      )}

      {recommendation.healthCorrectionApplied && (
        <p className="mt-3 text-xs text-black/50 dark:text-white/50">
          ※ 室内外の温度差が大きくなりすぎないよう、設定温度を調整しています。
        </p>
      )}
    </section>
  );
}
