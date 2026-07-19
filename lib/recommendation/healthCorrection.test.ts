import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMETERS } from "./constants";
import { applyCoolingHealthCorrection } from "./healthCorrection";

describe("applyCoolingHealthCorrection", () => {
  it("快適域の算出値が下限内なら補正しない", () => {
    // 外気温35℃なら下限は28℃。算出値27.6℃(実質)より高い29℃は補正不要。
    const result = applyCoolingHealthCorrection(29, 35, DEFAULT_PARAMETERS);
    expect(result).toEqual({ correctedTemp: 29, applied: false });
  });

  it("算出値が下限を下回る場合は下限でクリップする", () => {
    // 外気温35℃なら下限は28℃。算出値26℃は下限に補正される。
    const result = applyCoolingHealthCorrection(26, 35, DEFAULT_PARAMETERS);
    expect(result).toEqual({ correctedTemp: 28, applied: true });
  });
});
