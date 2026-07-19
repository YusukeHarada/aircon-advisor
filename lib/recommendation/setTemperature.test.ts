import { describe, expect, it } from "vitest";
import { calculateDiscomfortIndex } from "./discomfortIndex";
import { calculateCoolingSetTemperature, calculateHeatingSetTemperature } from "./setTemperature";

describe("calculateCoolingSetTemperature", () => {
  it("算出した設定温度で目標DIに戻ることを確認する（5.1の逆算）", () => {
    const diTarget = 71;
    const indoorHumidity = 55;
    const setTemp = calculateCoolingSetTemperature(diTarget, indoorHumidity);
    const recomputedDi = calculateDiscomfortIndex(setTemp, indoorHumidity);
    expect(recomputedDi).toBeCloseTo(diTarget, 5);
  });
});

describe("calculateHeatingSetTemperature", () => {
  it("基準室温をそのまま返す", () => {
    expect(calculateHeatingSetTemperature(21)).toBe(21);
  });
});
