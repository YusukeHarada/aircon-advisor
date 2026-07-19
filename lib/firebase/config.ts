/**
 * Firebaseの設定（環境変数）が用意されているかを判定する。
 * .env.local を用意していない開発初期段階でもアプリを触れるよう、
 * 未設定時はローカル（ブラウザ内）のモック実装にフォールバックする（lib/demo/ 配下）。
 * Firebaseプロジェクトを用意でき次第、.env.local を設定すれば自動的に本物のFirestore/Authに切り替わる。
 */
export function isFirebaseClientConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
}

export function isFirebaseAdminConfigured(): boolean {
  return Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
}
