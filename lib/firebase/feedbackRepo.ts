import { collection, doc, limit, onSnapshot, orderBy, query, runTransaction, serverTimestamp, Timestamp } from "firebase/firestore";
import { DEFAULT_PARAMETERS } from "@/lib/recommendation/constants";
import { clampOffset, type FeedbackSignal } from "@/lib/recommendation/offset";
import { getFirebaseDb } from "./client";

export interface FeedbackEntry {
  id: string;
  signal: FeedbackSignal;
  createdAt: Date;
  tempAtFeedback: number;
  appliedDelta: number;
  deleted: boolean;
}

function settingsDocRef(uid: string) {
  return doc(getFirebaseDb(), "users", uid, "settings", "main");
}

function feedbackCollectionRef(uid: string) {
  return collection(getFirebaseDb(), "users", uid, "feedback");
}

/**
 * 5.7 フィードバック入力によるオフセット調整。
 * 設定ドキュメントの offset と feedback ドキュメントをトランザクションで同時更新し、
 * 取り消し時に正確な逆算ができるよう実際に反映した差分（クランプ後の実効値）を保存する。
 */
export async function addFeedback(uid: string, signal: FeedbackSignal, tempAtFeedback: number): Promise<void> {
  const feedbackRef = doc(feedbackCollectionRef(uid));
  const settingsRef = settingsDocRef(uid);

  await runTransaction(getFirebaseDb(), async (tx) => {
    const settingsSnap = await tx.get(settingsRef);
    const currentOffset = settingsSnap.exists() ? ((settingsSnap.data() as { offset?: number }).offset ?? 0) : 0;

    const step = DEFAULT_PARAMETERS.feedbackOffsetStep;
    const rawDelta = signal === "hot" ? -step : step;
    const newOffset = clampOffset(currentOffset + rawDelta, DEFAULT_PARAMETERS.personalOffsetRange);
    const appliedDelta = newOffset - currentOffset;

    tx.set(settingsRef, { offset: newOffset }, { merge: true });
    tx.set(feedbackRef, {
      signal,
      created_at: serverTimestamp(),
      temp_at_feedback: tempAtFeedback,
      applied_delta: appliedDelta,
      deleted: false,
    });
  });
}

/** 直近のフィードバック入力を取り消し、加算したオフセットを打ち消す */
export async function undoFeedback(uid: string, feedbackId: string): Promise<void> {
  const feedbackRef = doc(feedbackCollectionRef(uid), feedbackId);
  const settingsRef = settingsDocRef(uid);

  await runTransaction(getFirebaseDb(), async (tx) => {
    const feedbackSnap = await tx.get(feedbackRef);
    if (!feedbackSnap.exists()) return;

    const data = feedbackSnap.data() as { deleted?: boolean; applied_delta?: number };
    if (data.deleted) return;

    const settingsSnap = await tx.get(settingsRef);
    const currentOffset = settingsSnap.exists() ? ((settingsSnap.data() as { offset?: number }).offset ?? 0) : 0;
    const newOffset = clampOffset(currentOffset - (data.applied_delta ?? 0), DEFAULT_PARAMETERS.personalOffsetRange);

    tx.set(settingsRef, { offset: newOffset }, { merge: true });
    tx.update(feedbackRef, { deleted: true });
  });
}

interface FeedbackDoc {
  signal: FeedbackSignal;
  created_at: Timestamp | null;
  temp_at_feedback: number;
  applied_delta: number;
  deleted: boolean;
}

/** 直近N件（削除済み含む）を購読する。先頭が取り消し対象の最新入力になる。 */
export function subscribeRecentFeedback(uid: string, count: number, callback: (entries: FeedbackEntry[]) => void) {
  const q = query(feedbackCollectionRef(uid), orderBy("created_at", "desc"), limit(count));

  return onSnapshot(q, (snapshot) => {
    const entries = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as FeedbackDoc;
      return {
        id: docSnap.id,
        signal: data.signal,
        createdAt: data.created_at?.toDate() ?? new Date(0),
        tempAtFeedback: data.temp_at_feedback,
        appliedDelta: data.applied_delta,
        deleted: data.deleted,
      } satisfies FeedbackEntry;
    });
    callback(entries);
  });
}
