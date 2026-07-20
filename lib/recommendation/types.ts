export type OperationMode = "cooling" | "heating" | "dehumidify" | "fan" | "unnecessary";

export type Season = "summer" | "winter";

export interface WeatherInput {
  /** 外気温（℃） */
  outdoorTemp: number;
  /** 相対湿度（%） */
  outdoorHumidity: number;
}

export interface RecommendationParams {
  comfortDiTarget: number;
  indoorHumidity: number;
  heatingBaseRoomTemp: number;
  coolingThresholdTemp: number;
  heatingThresholdTemp: number;
  highHumidityThreshold: number;
  midSeasonComfortableTempRange: { min: number; max: number };
  maxIndoorOutdoorTempGap: number;
  /** 熱中症予防のための冷房設定温度の絶対上限（℃）。温度差ガードレールより優先される。 */
  maxSafeCoolingTemp: number;
  energySavingOffset: number;
  personalOffsetRange: { min: number; max: number };
  /** 提案する設定温度の丸め幅（℃）。多くのエアコンリモコンの操作粒度に合わせる。 */
  displayTempStep: number;
}

export interface Recommendation {
  mode: OperationMode;
  /** 主推奨の設定温度（℃）。送風／不要の場合は null。 */
  mainSetTemp: number | null;
  /** 省エネ別案の設定温度（℃）。主推奨がない場合は null。 */
  energySavingSetTemp: number | null;
  /** 健康補正が適用されたかどうか（5.5節のガードレール発動有無） */
  healthCorrectionApplied: boolean;
  /** 判定理由（画面表示用の平易な説明の元になる識別子） */
  reason: "hot-outdoor" | "cold-outdoor" | "mid-season-humid" | "mid-season-comfortable" | "mid-season-mild";
}
