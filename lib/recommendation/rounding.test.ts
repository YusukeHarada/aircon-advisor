import { describe, expect, it } from "vitest";
import { roundToStep } from "./rounding";

describe("roundToStep", () => {
  it("0.5刻みに丸める", () => {
    expect(roundToStep(24.1, 0.5)).toBe(24);
    expect(roundToStep(24.3, 0.5)).toBe(24.5);
    expect(roundToStep(24.26, 0.5)).toBe(24.5);
    expect(roundToStep(24.24, 0.5)).toBe(24);
  });

  it("ちょうど刻みの境界はそのまま", () => {
    expect(roundToStep(25, 0.5)).toBe(25);
    expect(roundToStep(25.5, 0.5)).toBe(25.5);
  });

  it("負の値も丸められる", () => {
    expect(roundToStep(-1.3, 0.5)).toBe(-1.5);
  });
});
