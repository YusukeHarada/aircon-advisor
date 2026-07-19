export function DemoModeBanner() {
  return (
    <p className="rounded-lg border border-amber-400/50 bg-amber-400/10 p-3 text-xs text-amber-800 dark:text-amber-300">
      デモモードで動作しています（Firebase未設定）。データはこのブラウザにのみ保存されます。
      本番運用するには <code>.env.local</code> にFirebaseの設定を追加してください（
      <code>.env.local.example</code> 参照）。
    </p>
  );
}
