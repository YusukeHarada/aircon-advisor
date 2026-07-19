"use client";

import { onAuthStateChanged, signInAnonymously, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { getFirebaseAuth } from "./client";

type AuthState =
  | { status: "loading"; user: null }
  | { status: "signed-in"; user: User }
  | { status: "error"; user: null; error: Error };

/**
 * F-00: 初回起動時に匿名認証でuidを発行する。
 * サインイン済みでなければ signInAnonymously を呼び、以降は onAuthStateChanged を購読する。
 */
export function useAnonymousAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ status: "loading", user: null });

  useEffect(() => {
    try {
      const auth = getFirebaseAuth();
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          if (user) {
            setState({ status: "signed-in", user });
            return;
          }
          signInAnonymously(auth).catch((error: Error) => {
            setState({ status: "error", user: null, error });
          });
        },
        (error) => {
          setState({ status: "error", user: null, error });
        },
      );

      return () => unsubscribe();
    } catch (error) {
      // Firebase設定が不正（APIキー未設定等）な場合、getFirebaseAuth/onAuthStateChangedが
      // 同期的に例外を投げることがある。画面クラッシュではなくエラー状態として扱う。
      // マイクロタスクへ逃がし、エフェクト本体からの同期setStateを避ける。
      queueMicrotask(() => {
        setState({ status: "error", user: null, error: error as Error });
      });
    }
  }, []);

  return state;
}
