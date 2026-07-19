import { collection, doc, limit, onSnapshot, orderBy, query, runTransaction, serverTimestamp, Timestamp } from "firebase/firestore";
import { readJson, subscribeKey, writeJson } from "@/lib/demo/localStore";
import { DEFAULT_PARAMETERS } from "@/lib/recommendation/constants";
import { clampOffset, type FeedbackSignal } from "@/lib/recommendation/offset";
import { isFirebaseClientConfigured } from "./config";
import { getFirebaseDb } from "./client";
import { demoSettingsKey } from "./settingsRepo";

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

function demoFeedbackKey(uid: string): string {
  return `aircon-advisor:feedback:${uid}`;
}

interface DemoFeedbackEntry {
  id: string;
  signal: FeedbackSignal;
  created_at: string;
  temp_at_feedback: number;
  applied_delta: number;
  deleted: boolean;
}

function readDemoOffset(uid: string): number {
  return readJson<{ offset?: number }>(demoSettingsKey(uid))?.offset ?? 0;
}

function writeDemoOffset(uid: string, offset: number): void {
  const current = readJson<Record<string, unknown>>(demoSettingsKey(uid)) ?? {};
  writeJson(demoSettingsKey(uid), { ...current, offset });
}

/**
 * 5.7 フィードバック入力によるオフセット調整。
 * 設定ドキュメントの offset と feedback ドキュメントをトランザクションで同時更新し、
 * 取り消し時に正確な逆算ができるよう実際に反映した差分（クランプ後の実効値）を保存する。
 * Firebase未設定時はlocalStorageベースのデモストアで同等の処理を行う。
 */
export async function addFeedback(uid: string, signal: FeedbackSignal, tempAtFeedback: number): Promise<void> {
  if (!isFirebaseClientConfigured()) {
    const currentOffset = readDemoOffset(uid);
    const step = DEFAULT_PARAMETERS.feedbackOffsetStep;
    const rawDelta = signal === "hot" ? -step : step;
    const newOffset = clampOffset(currentOffset + rawDelta, DEFAULT_PARAMETERS.personalOffsetRange);
    const appliedDelta = newOffset - currentOffset;

    const entries = readJson<DemoFeedbackEntry[]>(demoFeedbackKey(uid)) ?? [];
    entries.unshift({
      id: crypto.randomUUID(),
      signal,
      created_at: new Date().toISOString(),
      temp_at_feedback: tempAtFeedback,
      applied_delta: appliedDelta,
      deleted: false,
    });
    writeJson(demoFeedbackKey(uid), entries);
    writeDemoOffset(uid, newOffset);
    return;
  }

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
  if (!isFirebaseClientConfigured()) {
    const entries = readJson<DemoFeedbackEntry[]>(demoFeedbackKey(uid)) ?? [];
    const target = entries.find((entry) => entry.id === feedbackId);
    if (!target || target.deleted) return;

    target.deleted = true;
    writeJson(demoFeedbackKey(uid), entries);

    const currentOffset = readDemoOffset(uid);
    const newOffset = clampOffset(currentOffset - target.applied_delta, DEFAULT_PARAMETERS.personalOffsetRange);
    writeDemoOffset(uid, newOffset);
    return;
  }

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

function toFeedbackEntry(demo: DemoFeedbackEntry): FeedbackEntry {
  return {
    id: demo.id,
    signal: demo.signal,
    createdAt: new Date(demo.created_at),
    tempAtFeedback: demo.temp_at_feedback,
    appliedDelta: demo.applied_delta,
    deleted: demo.deleted,
  };
}

/** 直近N件（削除済み含む）を購読する。先頭が取り消し対象の最新入力になる。 */
export function subscribeRecentFeedback(uid: string, count: number, callback: (entries: FeedbackEntry[]) => void) {
  if (!isFirebaseClientConfigured()) {
    return subscribeKey<DemoFeedbackEntry[]>(demoFeedbackKey(uid), (entries) =>
      callback((entries ?? []).slice(0, count).map(toFeedbackEntry)),
    );
  }

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
