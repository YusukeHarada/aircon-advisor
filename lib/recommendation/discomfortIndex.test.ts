import { describe, expect, it } from "vitest";
import { calculateDiscomfortIndex } from "./discomfortIndex";

describe("calculateDiscomfortIndex", () => {
  it("30℃・湿度70%で高いDIになる", () => {
    const di = calculateDiscomfortIndex(30, 70);
    expect(di).toBeCloseTo(81.38, 1);
  });

  it("0℃・湿度50%で低いDIになる", () => {
    const di = calculateDiscomfortIndex(0, 50);
    expect(di).toBeCloseTo(39.15, 1);
  });
});
