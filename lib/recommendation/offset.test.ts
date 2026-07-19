import { describe, expect, it } from "vitest";
import { applyPersonalOffset, clampOffset, computeOffsetFromFeedback } from "./offset";

describe("clampOffset", () => {
  it("範囲内はそのまま", () => {
    expect(clampOffset(1, { min: -2, max: 2 })).toBe(1);
  });

  it("上限を超えたら上限にクランプ", () => {
    expect(clampOffset(5, { min: -2, max: 2 })).toBe(2);
  });

  it("下限を下回ったら下限にクランプ", () => {
    expect(clampOffset(-5, { min: -2, max: 2 })).toBe(-2);
  });
});

describe("applyPersonalOffset", () => {
  it("温度にオフセットを加算する", () => {
    expect(applyPersonalOffset(27, -1)).toBe(26);
  });
});

describe("computeOffsetFromFeedback", () => {
  it("hotフィードバックはオフセットを下げる", () => {
    const result = computeOffsetFromFeedback(0, ["hot"], 0.5, { min: -2, max: 2 });
    expect(result).toBe(-0.5);
  });

  it("coldフィードバックはオフセットを上げる", () => {
    const result = computeOffsetFromFeedback(0, ["cold", "cold"], 0.5, { min: -2, max: 2 });
    expect(result).toBe(1);
  });

  it("累積が範囲を超えたらクランプする", () => {
    const result = computeOffsetFromFeedback(1.8, ["cold", "cold"], 0.5, { min: -2, max: 2 });
    expect(result).toBe(2);
  });
});
