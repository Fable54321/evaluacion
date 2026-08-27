import type { SectionARatings } from "../App/Evaluacion/SectionA";
import type { SectionBAnswers } from "../App/Evaluacion/SectionB";
import type { SectionCData } from "../App/Evaluacion/SectionC";

const DATABASE_NAME = "vegibec-evaluacion";
const DATABASE_VERSION = 1;
const WORKERS_STORE = "workers";
const OUTBOX_STORE = "evaluationOutbox";
export const OUTBOX_CHANGE_EVENT = "evaluation-outbox-change";

function notifyOutboxChange() {
  window.dispatchEvent(new Event(OUTBOX_CHANGE_EVENT));
}

export type OfflineEvaluationPayload = {
  clientSubmissionId: string;
  evaluatorId: number;
  evaluatedWorkerId: number;
  workType: "bodega" | "campo";
  positionTitle: string;
  sectionA: SectionARatings;
  sectionB: SectionBAnswers;
  sectionC: SectionCData;
};

export type OutboxEvaluation = {
  clientSubmissionId: string;
  payload: OfflineEvaluationPayload;
  createdAt: string;
  updatedAt: string;
  attempts: number;
  lastError: string | null;
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(WORKERS_STORE)) database.createObjectStore(WORKERS_STORE, { keyPath: "id" });
      if (!database.objectStoreNames.contains(OUTBOX_STORE)) {
        const outbox = database.createObjectStore(OUTBOX_STORE, { keyPath: "clientSubmissionId" });
        outbox.createIndex("createdAt", "createdAt");
      }
    };
  });
}

function waitForTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function cacheWorkers<T extends { id: number }>(workers: T[]) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(WORKERS_STORE, "readwrite");
    const store = transaction.objectStore(WORKERS_STORE);
    store.clear();
    workers.forEach((worker) => store.put(worker));
    await waitForTransaction(transaction);
  } finally {
    database.close();
  }
}

export async function getCachedWorkers<T>(): Promise<T[]> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(WORKERS_STORE, "readonly");
    return await requestResult(transaction.objectStore(WORKERS_STORE).getAll()) as T[];
  } finally {
    database.close();
  }
}

export async function queueEvaluation(payload: OfflineEvaluationPayload) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(OUTBOX_STORE, "readwrite");
    const store = transaction.objectStore(OUTBOX_STORE);
    const existing = await requestResult(store.get(payload.clientSubmissionId)) as OutboxEvaluation | undefined;
    const now = new Date().toISOString();
    store.put({ clientSubmissionId: payload.clientSubmissionId, payload, createdAt: existing?.createdAt ?? now, updatedAt: now, attempts: existing?.attempts ?? 0, lastError: existing?.lastError ?? null } satisfies OutboxEvaluation);
    await waitForTransaction(transaction);
    notifyOutboxChange();
  } finally {
    database.close();
  }
}

export async function getQueuedEvaluations(): Promise<OutboxEvaluation[]> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(OUTBOX_STORE, "readonly");
    const records = await requestResult(transaction.objectStore(OUTBOX_STORE).getAll()) as OutboxEvaluation[];
    return records.sort((first, second) => first.createdAt.localeCompare(second.createdAt));
  } finally {
    database.close();
  }
}

export async function removeQueuedEvaluation(clientSubmissionId: string) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(OUTBOX_STORE, "readwrite");
    transaction.objectStore(OUTBOX_STORE).delete(clientSubmissionId);
    await waitForTransaction(transaction);
    notifyOutboxChange();
  } finally {
    database.close();
  }
}

export async function recordQueueFailure(record: OutboxEvaluation, error: string) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(OUTBOX_STORE, "readwrite");
    transaction.objectStore(OUTBOX_STORE).put({ ...record, attempts: record.attempts + 1, lastError: error, updatedAt: new Date().toISOString() } satisfies OutboxEvaluation);
    await waitForTransaction(transaction);
    notifyOutboxChange();
  } finally {
    database.close();
  }
}
