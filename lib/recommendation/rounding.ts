/**
 * エアコンのリモコンは多くが0.5℃刻みでしか設定できないため、
 * 提案する設定温度は最終的にこの刻み幅へ丸める。
 */
export function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}
