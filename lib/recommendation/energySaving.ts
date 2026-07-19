import type { Season } from "./types";

/**
 * 5.6 省エネ別案（補足）
 * 主推奨を上書きせず、夏は+、冬は-のオフセットを加えた別案を返す。
 */
export function calculateEnergySavingSetTemperature(
  mainSetTemp: number,
  season: Season,
  energySavingOffset: number,
): number {
  return season === "summer" ? mainSetTemp + energySavingOffset : mainSetTemp - energySavingOffset;
}
