import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMETERS } from "./constants";
import { determineMode } from "./mode";

describe("determineMode", () => {
  it("外気温25℃以上は冷房", () => {
    const result = determineMode({ outdoorTemp: 30, outdoorHumidity: 50 }, DEFAULT_PARAMETERS);
    expect(result).toEqual({ mode: "cooling", reason: "hot-outdoor" });
  });

  it("外気温18℃未満は暖房", () => {
    const result = determineMode({ outdoorTemp: 10, outdoorHumidity: 50 }, DEFAULT_PARAMETERS);
    expect(result).toEqual({ mode: "heating", reason: "cold-outdoor" });
  });

  it("中間期で高湿度なら除湿", () => {
    const result = determineMode({ outdoorTemp: 22, outdoorHumidity: 75 }, DEFAULT_PARAMETERS);
    expect(result).toEqual({ mode: "dehumidify", reason: "mid-season-humid" });
  });

  it("中間期で快適温度帯なら不要", () => {
    const result = determineMode({ outdoorTemp: 21, outdoorHumidity: 50 }, DEFAULT_PARAMETERS);
    expect(result).toEqual({ mode: "unnecessary", reason: "mid-season-comfortable" });
  });

  it("中間期で快適温度帯を外れ低湿度なら送風", () => {
    const result = determineMode({ outdoorTemp: 19, outdoorHumidity: 50 }, DEFAULT_PARAMETERS);
    expect(result).toEqual({ mode: "fan", reason: "mid-season-mild" });
  });

  it("境界値（25℃ちょうど）は冷房", () => {
    const result = determineMode({ outdoorTemp: 25, outdoorHumidity: 50 }, DEFAULT_PARAMETERS);
    expect(result.mode).toBe("cooling");
  });

  it("境界値（18℃ちょうど）は中間期扱い", () => {
    const result = determineMode({ outdoorTemp: 18, outdoorHumidity: 50 }, DEFAULT_PARAMETERS);
    expect(result.mode).not.toBe("heating");
  });
});
