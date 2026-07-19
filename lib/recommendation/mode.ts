import type { OperationMode, RecommendationParams, WeatherInput } from "./types";

export interface ModeDecision {
  mode: OperationMode;
  reason: "hot-outdoor" | "cold-outdoor" | "mid-season-humid" | "mid-season-comfortable" | "mid-season-mild";
}

/**
 * 5.4 運転モード判定
 * 25℃以上：冷房 / 18〜24℃（中間期）：除湿・送風・不要を湿度・気温で分岐 / 18℃未満：暖房
 */
export function determineMode(weather: WeatherInput, params: RecommendationParams): ModeDecision {
  const { outdoorTemp, outdoorHumidity } = weather;

  if (outdoorTemp >= params.coolingThresholdTemp) {
    return { mode: "cooling", reason: "hot-outdoor" };
  }

  if (outdoorTemp < params.heatingThresholdTemp) {
    return { mode: "heating", reason: "cold-outdoor" };
  }

  // 中間期（18℃以上25℃未満）
  if (outdoorHumidity >= params.highHumidityThreshold) {
    return { mode: "dehumidify", reason: "mid-season-humid" };
  }

  const { min, max } = params.midSeasonComfortableTempRange;
  if (outdoorTemp >= min && outdoorTemp <= max) {
    return { mode: "unnecessary", reason: "mid-season-comfortable" };
  }

  return { mode: "fan", reason: "mid-season-mild" };
}
