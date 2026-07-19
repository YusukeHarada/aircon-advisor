import type { OperationMode, Recommendation } from "./types";

/**
 * ユーザー向け画面では「不快指数(DI)」等の内部指標名を出さず、
 * 平易な体感表現に変換する（要件定義書3章・8章）。
 */
export const MODE_LABELS: Record<OperationMode, string> = {
  cooling: "冷房",
  heating: "暖房",
  dehumidify: "除湿",
  fan: "送風",
  unnecessary: "エアコン不要",
};

export function explainReason(reason: Recommendation["reason"]): string {
  switch (reason) {
    case "hot-outdoor":
      return "外が暑いため、冷房がおすすめです。";
    case "cold-outdoor":
      return "外が寒いため、暖房がおすすめです。";
    case "mid-season-humid":
      return "湿度が高く蒸し暑さを感じやすいため、除湿がおすすめです。";
    case "mid-season-comfortable":
      return "過ごしやすい陽気なので、エアコンは不要です。";
    case "mid-season-mild":
      return "気温は穏やかですが空気がこもりやすいため、送風がおすすめです。";
  }
}
