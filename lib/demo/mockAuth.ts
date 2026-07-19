"use client";

const UID_KEY = "aircon-advisor:demo-uid";

/** Firebase未設定時、ブラウザに固定のダミーuidを発行・永続化する */
export function getOrCreateDemoUid(): string {
  if (typeof window === "undefined") return "demo";

  const existing = window.localStorage.getItem(UID_KEY);
  if (existing) return existing;

  const uid = `demo-${crypto.randomUUID()}`;
  window.localStorage.setItem(UID_KEY, uid);
  return uid;
}
