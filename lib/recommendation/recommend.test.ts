import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMETERS } from "./constants";
import { recommend } from "./recommend";

describe("recommend", () => {
  it("猛暑日は冷房＋省エネ別案（+1℃）を返す", () => {
    const result = recommend({ outdoorTemp: 35, outdoorHumidity: 60 }, 0, DEFAULT_PARAMETERS);
    expect(result.mode).toBe("cooling");
    expect(result.mainSetTemp).not.toBeNull();
    expect(result.energySavingSetTemp).toBeCloseTo((result.mainSetTemp as number) + 1, 5);
  });

  it("猛暑日で健康補正が効くケース（極端に低い目標DIでも下限より下がらない）", () => {
    const params = { ...DEFAULT_PARAMETERS, comfortDiTarget: 60 };
    const result = recommend({ outdoorTemp: 35, outdoorHumidity: 60 }, 0, params);
    // 温度差ガードレールの下限は35-7=28だが、熱中症予防の絶対上限27の方が低いためそちらが下限になる。
    expect(result.mainSetTemp).toBeGreaterThanOrEqual(27);
    expect(result.healthCorrectionApplied).toBe(true);
  });

  it("猛暑日でも熱中症予防の絶対上限を超えて提案しない", () => {
    const result = recommend({ outdoorTemp: 40, outdoorHumidity: 60 }, 0, DEFAULT_PARAMETERS);
    // 温度差ガードレールなら下限33になるところ、絶対上限27の方を優先する。
    expect(result.mainSetTemp).toBe(27);
  });

  it("寒い日は暖房＋省エネ別案（-1℃）を返す", () => {
    const result = recommend({ outdoorTemp: 5, outdoorHumidity: 40 }, 0, DEFAULT_PARAMETERS);
    expect(result.mode).toBe("heating");
    expect(result.mainSetTemp).toBe(21);
    expect(result.energySavingSetTemp).toBe(20);
  });

  it("高湿度の中間期は除湿を優先する", () => {
    const result = recommend({ outdoorTemp: 22, outdoorHumidity: 80 }, 0, DEFAULT_PARAMETERS);
    expect(result.mode).toBe("dehumidify");
    expect(result.mainSetTemp).not.toBeNull();
  });

  it("快適な中間期はエアコン不要で設定温度なし", () => {
    const result = recommend({ outdoorTemp: 21, outdoorHumidity: 50 }, 0, DEFAULT_PARAMETERS);
    expect(result.mode).toBe("unnecessary");
    expect(result.mainSetTemp).toBeNull();
    expect(result.energySavingSetTemp).toBeNull();
  });

  it("個人オフセットが主推奨・省エネ別案の両方に反映される", () => {
    const withoutOffset = recommend({ outdoorTemp: 35, outdoorHumidity: 60 }, 0, DEFAULT_PARAMETERS);
    const withOffset = recommend({ outdoorTemp: 35, outdoorHumidity: 60 }, -1, DEFAULT_PARAMETERS);
    expect(withOffset.mainSetTemp).toBeCloseTo((withoutOffset.mainSetTemp as number) - 1, 5);
  });

  it("提案温度はエアコンのリモコン粒度に合わせて0.5℃刻みに丸められる", () => {
    // comfortDiTarget=71, indoorHumidity=55 の生の計算値は約24.04℃（グリッドから外れる）。
    // 健康補正が効かない外気温（下限が十分低い）で検証する。
    const result = recommend({ outdoorTemp: 30, outdoorHumidity: 40 }, 0, DEFAULT_PARAMETERS);
    expect(result.mode).toBe("cooling");
    const mainSetTemp = result.mainSetTemp as number;
    expect(mainSetTemp * 2).toBeCloseTo(Math.round(mainSetTemp * 2), 10);
  });
});
