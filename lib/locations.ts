/**
 * オンボーディング／設定画面での地点選択用の候補地点。
 * 気象庁のアメダス観測所コードは要件定義書7章の運用注記のとおり
 * デプロイ前に正確な値を確認すること（ここでは代表的な主要都市のみを暫定的に収録）。
 */
export interface LocationOption {
  code: string;
  label: string;
}

export const LOCATION_OPTIONS: LocationOption[] = [
  { code: "44132", label: "東京" },
  { code: "62078", label: "大阪" },
  { code: "14163", label: "札幌" },
  { code: "51106", label: "名古屋" },
  { code: "82182", label: "福岡" },
  { code: "40336", label: "つくば" },
];

export function findLocationLabel(code: string | null): string {
  if (!code) return "未設定";
  return LOCATION_OPTIONS.find((option) => option.code === code)?.label ?? code;
}
