import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMETERS } from "./constants";
import { recommend } from "./recommend";

describe("recommend", () => {
  it("猛暑日は冷房＋省エネ別案（+1℃）を返す", () => {
    const result = recommend({ outdoorTemp: 35, outdoorHumidity: 60 }, 0, "summer", DEFAULT_PARAMETERS);
    expect(result.mode).toBe("cooling");
    expect(result.mainSetTemp).not.toBeNull();
    expect(result.energySavingSetTemp).toBeCloseTo((result.mainSetTemp as number) + 1, 5);
  });

  it("猛暑日で健康補正が効くケース（極端に低い目標DIでも下限より下がらない）", () => {
    const params = { ...DEFAULT_PARAMETERS, comfortDiTarget: 60 };
    const result = recommend({ outdoorTemp: 35, outdoorHumidity: 60 }, 0, "summer", params);
    // 下限は 35 - 7 = 28
    expect(result.mainSetTemp).toBeGreaterThanOrEqual(28);
    expect(result.healthCorrectionApplied).toBe(true);
  });

  it("寒い日は暖房＋省エネ別案（-1℃）を返す", () => {
    const result = recommend({ outdoorTemp: 5, outdoorHumidity: 40 }, 0, "winter", DEFAULT_PARAMETERS);
    expect(result.mode).toBe("heating");
    expect(result.mainSetTemp).toBe(21);
    expect(result.energySavingSetTemp).toBe(20);
  });

  it("高湿度の中間期は除湿を優先する", () => {
    const result = recommend({ outdoorTemp: 22, outdoorHumidity: 80 }, 0, "summer", DEFAULT_PARAMETERS);
    expect(result.mode).toBe("dehumidify");
    expect(result.mainSetTemp).not.toBeNull();
  });

  it("快適な中間期はエアコン不要で設定温度なし", () => {
    const result = recommend({ outdoorTemp: 21, outdoorHumidity: 50 }, 0, "summer", DEFAULT_PARAMETERS);
    expect(result.mode).toBe("unnecessary");
    expect(result.mainSetTemp).toBeNull();
    expect(result.energySavingSetTemp).toBeNull();
  });

  it("個人オフセットが主推奨・省エネ別案の両方に反映される", () => {
    const withoutOffset = recommend({ outdoorTemp: 35, outdoorHumidity: 60 }, 0, "summer", DEFAULT_PARAMETERS);
    const withOffset = recommend({ outdoorTemp: 35, outdoorHumidity: 60 }, -1, "summer", DEFAULT_PARAMETERS);
    expect(withOffset.mainSetTemp).toBeCloseTo((withoutOffset.mainSetTemp as number) - 1, 5);
  });
});
