"use client";

import { onAuthStateChanged, signInAnonymously, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "./client";

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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setState({ status: "signed-in", user });
        return;
      }
      signInAnonymously(auth).catch((error: Error) => {
        setState({ status: "error", user: null, error });
      });
    });

    return () => unsubscribe();
  }, []);

  return state;
}
