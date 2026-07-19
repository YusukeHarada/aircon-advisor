export interface WeatherSnapshot {
  /** 外気温（℃） */
  temp: number;
  /** 相対湿度（%） */
  humidity: number;
  fetchedAt: Date;
}

/**
 * 気象データ取得の抽象化レイヤ（要件定義書7章）。
 * 気象庁を主実装とするが、将来的なソース差し替え（OpenWeatherMap等）に備えて
 * インタフェースを分離する。
 */
export interface WeatherProvider {
  /** locationCode: 気象庁のアメダス観測所コード等、プロバイダ固有の地点識別子 */
  fetchCurrentWeather(locationCode: string): Promise<WeatherSnapshot>;
}
