import { getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { initializeFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Next.js のビルド時ページデータ収集はクライアントコンポーネントのモジュールも一度評価するため、
// トップレベルで getAuth()/getFirestore() を呼ぶと環境変数未設定時にビルドが失敗する。
// 実際に使用される（＝ブラウザで呼び出される）タイミングまで初期化を遅延させる。
let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let dbInstance: Firestore | undefined;

function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps()[0] ?? initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp());
  }
  return authInstance;
}

export function getFirebaseDb(): Firestore {
  if (!dbInstance) {
    // SafariはFirestoreの通信（onSnapshotのListenだけでなく書き込みのWriteチャンネルも）が
    // "due to access control checks" というFetch APIのエラーで失敗することがある
    // （Firebase JS SDKの既知の問題）。experimentalAutoDetectLongPollingは自動判定に
    // 頼るため、この既知の失敗パターンを正しく検知できずストリーミングのまま失敗し続ける
    // ケースが報告されている。判定に頼らず常にロングポーリングを使うよう強制する。
    dbInstance = initializeFirestore(getFirebaseApp(), {
      experimentalForceLongPolling: true,
    });
  }
  return dbInstance;
}
