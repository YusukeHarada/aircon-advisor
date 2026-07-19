/**
 * 5.1 不快指数（DI）
 * DI = 0.81 * T + 0.01 * H * (0.99 * T - 14.3) + 46.3
 */
export function calculateDiscomfortIndex(tempCelsius: number, relativeHumidityPercent: number): number {
  const t = tempCelsius;
  const h = relativeHumidityPercent;
  return 0.81 * t + 0.01 * h * (0.99 * t - 14.3) + 46.3;
}
