import { calculateEnergySavingSetTemperature } from "./energySaving";
import { applyCoolingHealthCorrection } from "./healthCorrection";
import { determineMode } from "./mode";
import { applyPersonalOffset } from "./offset";
import { calculateCoolingSetTemperature, calculateHeatingSetTemperature } from "./setTemperature";
import type { Recommendation, RecommendationParams, WeatherInput } from "./types";

/**
 * 快適性（主目的）→健康（制約）→省エネ（補足）の優先順位で
 * 推奨設定温度・運転モードを算出する（要件定義書1章・5章）。
 * 季節は運転モードから一意に決まる（冷房＝夏、暖房＝冬）ため、
 * 呼び出し側で別途指定する必要はない。
 */
export function recommend(weather: WeatherInput, personalOffset: number, params: RecommendationParams): Recommendation {
  const { mode, reason } = determineMode(weather, params);

  if (mode === "fan" || mode === "unnecessary") {
    return {
      mode,
      mainSetTemp: null,
      energySavingSetTemp: null,
      healthCorrectionApplied: false,
      reason,
    };
  }

  if (mode === "dehumidify") {
    // 高湿度時は除湿を優先提示する（5.5健康補正）。設定温度は冷房算出値を流用する。
    const comfortTemp = calculateCoolingSetTemperature(params.comfortDiTarget, params.indoorHumidity);
    const withOffset = applyPersonalOffset(comfortTemp, personalOffset);
    return {
      mode,
      mainSetTemp: withOffset,
      energySavingSetTemp: null,
      healthCorrectionApplied: true,
      reason,
    };
  }

  if (mode === "cooling") {
    const comfortTemp = calculateCoolingSetTemperature(params.comfortDiTarget, params.indoorHumidity);
    const { correctedTemp, applied } = applyCoolingHealthCorrection(comfortTemp, weather.outdoorTemp, params);
    const mainSetTemp = applyPersonalOffset(correctedTemp, personalOffset);
    const energySavingSetTemp = calculateEnergySavingSetTemperature(mainSetTemp, "summer", params.energySavingOffset);

    return {
      mode,
      mainSetTemp,
      energySavingSetTemp,
      healthCorrectionApplied: applied,
      reason,
    };
  }

  // mode === "heating"
  const baseTemp = calculateHeatingSetTemperature(params.heatingBaseRoomTemp);
  const mainSetTemp = applyPersonalOffset(baseTemp, personalOffset);
  const energySavingSetTemp = calculateEnergySavingSetTemperature(mainSetTemp, "winter", params.energySavingOffset);

  return {
    mode,
    mainSetTemp,
    energySavingSetTemp,
    healthCorrectionApplied: false,
    reason,
  };
}
