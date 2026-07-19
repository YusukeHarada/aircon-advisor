"use client";

/**
 * Firebase未設定時のデモモード用、ブラウザのlocalStorageを使った簡易ストア。
 * 同一タブ内の購読者に通知するだけの最小実装（複数タブ間の同期は行わない）。
 */
const listeners = new Map<string, Set<() => void>>();

export function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  notify(key);
}

function notify(key: string): void {
  listeners.get(key)?.forEach((fn) => fn());
}

/** 現在値を即座に1回通知した上で、以後の変更を購読する */
export function subscribeKey<T>(key: string, callback: (value: T | null) => void): () => void {
  const emit = () => callback(readJson<T>(key));
  emit();

  if (!listeners.has(key)) listeners.set(key, new Set());
  const set = listeners.get(key);
  set?.add(emit);

  return () => set?.delete(emit);
}
