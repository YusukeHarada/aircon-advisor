/**
 * 要件定義書（docs/requirements.md）5章のロジック仕様に対応する初期値。
 * D-06により、将来的には Firestore の設定コレクション（config/parameters）で
 * 上書き可能にする想定。現状はコード上のデフォルト値として定義する。
 */
export const DEFAULT_PARAMETERS = {
  /** 5.1/5.2: 目標室内不快指数（初期値71） */
  comfortDiTarget: 71,
  /** 5.2: 想定室内湿度（冷房により外気湿度より低下する想定、初期値55%） */
  indoorHumidity: 55,
  /** 5.3: 暖房時の基準室温（20〜22℃の中央値） */
  heatingBaseRoomTemp: 21,
  /** 5.4: 運転モード判定の外気温閾値 */
  coolingThresholdTemp: 25,
  heatingThresholdTemp: 18,
  /** 5.4/5.5: 高湿度とみなす閾値（除湿優先・中間期の除湿分岐で共通利用） */
  highHumidityThreshold: 70,
  /** 5.4: 中間期のうち「エアコン不要」と判定する外気温の範囲 */
  midSeasonComfortableTempRange: { min: 20, max: 23 },
  /** 5.5: 室内外温度差の上限（冷房時の設定温度下限を outdoorTemp - この値でクリップ） */
  maxIndoorOutdoorTempGap: 7,
  /**
   * 5.5: 熱中症予防の観点での冷房設定温度の絶対上限。猛暑日は温度差ガードレール
   * （outdoorTemp - maxIndoorOutdoorTempGap）の方が高くなることがあるが、その場合は
   * この絶対上限を優先する（室温を上げすぎない）。
   */
  maxSafeCoolingTemp: 27,
  /** 5.6: 省エネ別案のオフセット（夏は+、冬は-） */
  energySavingOffset: 1,
  /** 5.7: 個人オフセットの許容範囲 */
  personalOffsetRange: { min: -2, max: 2 },
  /** 5.7: 1件のフィードバックが動かすオフセット量 */
  feedbackOffsetStep: 0.5,
  /** 提案する設定温度の丸め幅（多くのエアコンリモコンは0.5℃刻みでしか設定できないため） */
  displayTempStep: 0.5,
} as const;
