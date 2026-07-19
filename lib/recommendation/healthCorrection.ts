import type { RecommendationParams } from "./types";

export interface HealthCorrectionResult {
  correctedTemp: number;
  applied: boolean;
}

/**
 * 5.5 健康補正（制約）
 * 冷房時のみ、室内外温度差の上限を超える設定（外気温比で低すぎる設定温度）を
 * `外気温 - maxIndoorOutdoorTempGap` でクリップする。快適域の算出値がこの範囲内なら補正しない。
 * 高湿度時の除湿優先は mode.ts 側（determineMode）で扱う。
 */
export function applyCoolingHealthCorrection(
  proposedTemp: number,
  outdoorTemp: number,
  params: RecommendationParams,
): HealthCorrectionResult {
  const lowerBound = outdoorTemp - params.maxIndoorOutdoorTempGap;

  if (proposedTemp < lowerBound) {
    return { correctedTemp: lowerBound, applied: true };
  }

  return { correctedTemp: proposedTemp, applied: false };
}
