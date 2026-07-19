"use client";

import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { useEffect, useState } from "react";
import { isFirebaseClientConfigured } from "./config";
import { getFirebaseAuth } from "./client";
import { getOrCreateDemoUid } from "@/lib/demo/mockAuth";

export interface AuthUser {
  uid: string;
}

type AuthState =
  | { status: "loading"; user: null }
  | { status: "signed-in"; user: AuthUser; demo: boolean }
  | { status: "error"; user: null; error: Error };

/**
 * F-00: 初回起動時に匿名認証でuidを発行する。
 * サインイン済みでなければ signInAnonymously を呼び、以降は onAuthStateChanged を購読する。
 *
 * Firebaseが未設定（.env.local 未作成）の場合は、ブラウザ内で固定のダミーuidを発行する
 * デモモードにフォールバックする。Firebaseプロジェクトの用意を後回しにしても
 * アプリの画面を一通り確認・開発できるようにするための措置。
 */
export function useAnonymousAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ status: "loading", user: null });

  useEffect(() => {
    if (!isFirebaseClientConfigured()) {
      // 初回レンダー（サーバー/クライアント共通で"loading"）とズレさせないよう、
      // マイクロタスクへ逃がしてからクライアント確定のuidに切り替える。
      queueMicrotask(() => {
        setState({ status: "signed-in", user: { uid: getOrCreateDemoUid() }, demo: true });
      });
      return;
    }

    try {
      const auth = getFirebaseAuth();
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          if (user) {
            setState({ status: "signed-in", user: { uid: user.uid }, demo: false });
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
