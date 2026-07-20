import type { RecommendationParams } from "./types";

export interface HealthCorrectionResult {
  correctedTemp: number;
  applied: boolean;
}

/**
 * 5.5 健康補正（制約）
 * 冷房時のみ、室内外温度差の上限を超える設定（外気温比で低すぎる設定温度）を
 * `外気温 - maxIndoorOutdoorTempGap` でクリップする。快適域の算出値がこの範囲内なら補正しない。
 *
 * 猛暑日は温度差ガードレールの下限（外気温 - maxIndoorOutdoorTempGap）自体が
 * 熱中症予防の観点で望ましい室温を超えてしまうことがある（例：外気温40℃なら下限33℃）。
 * その場合は「温度差を守る」より「室温を上げすぎない」ことを優先し、
 * maxSafeCoolingTemp（絶対上限）でさらにクリップする。
 *
 * 高湿度時の除湿優先は mode.ts 側（determineMode）で扱う。
 */
export function applyCoolingHealthCorrection(
  proposedTemp: number,
  outdoorTemp: number,
  params: RecommendationParams,
): HealthCorrectionResult {
  const gapLowerBound = outdoorTemp - params.maxIndoorOutdoorTempGap;
  const lowerBound = Math.min(gapLowerBound, params.maxSafeCoolingTemp);

  if (proposedTemp < lowerBound) {
    return { correctedTemp: lowerBound, applied: true };
  }

  return { correctedTemp: proposedTemp, applied: false };
}
