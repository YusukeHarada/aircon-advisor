import { describe, expect, it } from "vitest";
import { calculateEnergySavingSetTemperature } from "./energySaving";

describe("calculateEnergySavingSetTemperature", () => {
  it("夏は主推奨に+オフセット", () => {
    expect(calculateEnergySavingSetTemperature(27, "summer", 1)).toBe(28);
  });

  it("冬は主推奨に-オフセット", () => {
    expect(calculateEnergySavingSetTemperature(21, "winter", 1)).toBe(20);
  });
});
