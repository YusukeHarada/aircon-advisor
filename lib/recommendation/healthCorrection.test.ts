import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMETERS } from "./constants";
import { applyCoolingHealthCorrection } from "./healthCorrection";

describe("applyCoolingHealthCorrection", () => {
  it("快適域の算出値が下限内なら補正しない", () => {
    // 外気温35℃：温度差ガードレールの下限28℃・絶対上限27℃のうち小さい方＝27℃が下限。
    // 算出値29℃はそれより高いので補正不要。
    const result = applyCoolingHealthCorrection(29, 35, DEFAULT_PARAMETERS);
    expect(result).toEqual({ correctedTemp: 29, applied: false });
  });

  it("算出値が下限を下回る場合は下限でクリップする", () => {
    // 外気温35℃：下限は27℃（絶対上限が温度差ガードレール28℃より小さいため）。
    const result = applyCoolingHealthCorrection(26, 35, DEFAULT_PARAMETERS);
    expect(result).toEqual({ correctedTemp: 27, applied: true });
  });

  it("猛暑日は温度差ガードレールより熱中症予防の絶対上限を優先する", () => {
    // 外気温40℃なら温度差ガードレールの下限は33℃だが、絶対上限27℃の方が低いためそちらを採用する。
    const result = applyCoolingHealthCorrection(24, 40, DEFAULT_PARAMETERS);
    expect(result).toEqual({ correctedTemp: 27, applied: true });
  });
});
