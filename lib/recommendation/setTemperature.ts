/**
 * 5.2 冷房時の設定温度算出
 * T = (DI_target - 46.3 + 0.143 * H_in) / (0.81 + 0.0099 * H_in)
 */
export function calculateCoolingSetTemperature(diTarget: number, indoorHumidity: number): number {
  const hIn = indoorHumidity;
  return (diTarget - 46.3 + 0.143 * hIn) / (0.81 + 0.0099 * hIn);
}

/**
 * 5.3 暖房時の設定温度算出
 * 基準室温（20〜22℃の目安）に個人オフセットを加算して最終値とする。
 * オフセット加算は呼び出し側（recommend.ts）で一元的に行う。
 */
export function calculateHeatingSetTemperature(baseRoomTemp: number): number {
  return baseRoomTemp;
}
