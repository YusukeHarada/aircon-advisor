import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { readJson, subscribeKey, writeJson } from "@/lib/demo/localStore";
import { DEFAULT_PARAMETERS } from "@/lib/recommendation/constants";
import { isFirebaseClientConfigured } from "./config";
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

export function demoSettingsKey(uid: string): string {
  return `aircon-advisor:settings:${uid}`;
}

/** 初回起動時など、設定ドキュメントが未作成のユーザーを検出するために null を区別して返す */
export function subscribeUserSettings(uid: string, callback: (settings: UserSettings | null) => void) {
  if (!isFirebaseClientConfigured()) {
    return subscribeKey<SettingsDoc>(demoSettingsKey(uid), (data) => callback(data ? fromDoc(data) : null));
  }

  return onSnapshot(settingsDocRef(uid), (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    callback(fromDoc(snapshot.data() as SettingsDoc));
  });
}

export async function saveUserSettings(uid: string, settings: UserSettings): Promise<void> {
  const payload: SettingsDoc = {
    location: settings.location,
    offset: settings.offset,
    comfort_di_target: settings.comfortDiTarget,
    indoor_humidity: settings.indoorHumidity,
  };

  if (!isFirebaseClientConfigured()) {
    writeJson(demoSettingsKey(uid), payload);
    return;
  }

  await setDoc(settingsDocRef(uid), payload);
}

const DEFAULT_SETTINGS_DOC: SettingsDoc = {
  location: DEFAULT_SETTINGS.location,
  offset: DEFAULT_SETTINGS.offset,
  comfort_di_target: DEFAULT_SETTINGS.comfortDiTarget,
  indoor_humidity: DEFAULT_SETTINGS.indoorHumidity,
};

export async function updateOffset(uid: string, offset: number): Promise<void> {
  if (!isFirebaseClientConfigured()) {
    const current = readJson<SettingsDoc>(demoSettingsKey(uid)) ?? DEFAULT_SETTINGS_DOC;
    writeJson(demoSettingsKey(uid), { ...current, offset });
    return;
  }

  await setDoc(settingsDocRef(uid), { offset }, { merge: true });
}
