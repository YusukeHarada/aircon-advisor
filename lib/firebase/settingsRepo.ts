import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { DEFAULT_PARAMETERS } from "@/lib/recommendation/constants";
import { getFirebaseDb } from "./client";

const SETTINGS_DOC_ID = "main";

export interface UserSettings {
  /** 気象庁のアメダス観測所コード。未設定（オンボーディング未完了）なら null */
  location: string | null;
  offset: number;
  comfortDiTarget: number;
  indoorHumidity: number;
}

export const DEFAULT_SETTINGS: UserSettings = {
  location: null,
  offset: 0,
  comfortDiTarget: DEFAULT_PARAMETERS.comfortDiTarget,
  indoorHumidity: DEFAULT_PARAMETERS.indoorHumidity,
};

function settingsDocRef(uid: string) {
  return doc(getFirebaseDb(), "users", uid, "settings", SETTINGS_DOC_ID);
}

interface SettingsDoc {
  location: string | null;
  offset: number;
  comfort_di_target: number;
  indoor_humidity: number;
}

function fromDoc(data: SettingsDoc | undefined): UserSettings {
  if (!data) return DEFAULT_SETTINGS;
  return {
    location: data.location ?? null,
    offset: data.offset ?? 0,
    comfortDiTarget: data.comfort_di_target ?? DEFAULT_PARAMETERS.comfortDiTarget,
    indoorHumidity: data.indoor_humidity ?? DEFAULT_PARAMETERS.indoorHumidity,
  };
}

/** 初回起動時など、設定ドキュメントが未作成のユーザーを検出するために null を区別して返す */
export function subscribeUserSettings(uid: string, callback: (settings: UserSettings | null) => void) {
  return onSnapshot(settingsDocRef(uid), (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    callback(fromDoc(snapshot.data() as SettingsDoc));
  });
}

export async function saveUserSettings(uid: string, settings: UserSettings): Promise<void> {
  await setDoc(settingsDocRef(uid), {
    location: settings.location,
    offset: settings.offset,
    comfort_di_target: settings.comfortDiTarget,
    indoor_humidity: settings.indoorHumidity,
  } satisfies SettingsDoc);
}

export async function updateOffset(uid: string, offset: number): Promise<void> {
  await setDoc(settingsDocRef(uid), { offset }, { merge: true });
}
