import type {
  CreateVariationAlertPayload,
  MonthlyAnswers,
  MonthlyEvaluationQuestion,
  VariationAlertAction,
  VariationAlertReason,
  VariationAlertSinceWhen,
  VariationAlertType,
} from "../Contexts/evaluationContext";

const DATABASE_NAME = "vegibec-evaluacion";
const DATABASE_VERSION = 4;
const WORKERS_STORE = "workers";
const MONTHLY_QUESTIONS_STORE = "monthlyQuestions";
const OUTBOX_STORE = "evaluationOutbox";
const DRAFTS_STORE = "evaluationDrafts";
const VARIATION_ALERT_OUTBOX_STORE = "variationAlertOutbox";
const VARIATION_ALERT_DRAFTS_STORE = "variationAlertDrafts";
export const OUTBOX_CHANGE_EVENT = "evaluation-outbox-change";

function notifyOutboxChange() {
  window.dispatchEvent(new Event(OUTBOX_CHANGE_EVENT));
}

export type OfflineEvaluationPayload = {
  schemaVersion: 3;
  clientSubmissionId: string;
  evaluatorId: number;
  evaluatedWorkerId: number;
  evaluationType: "one_to_two_seasons";
  answers: MonthlyAnswers;
  comments: string;
};

export type OutboxEvaluation = {
  clientSubmissionId: string;
  payload: OfflineEvaluationPayload;
  createdAt: string;
  updatedAt: string;
  attempts: number;
  lastError: string | null;
};

export type EvaluationDraft = OfflineEvaluationPayload & {
  userId: number;
  step: "setup" | "evaluation";
  updatedAt: string;
};

export type OfflineVariationAlertPayload = CreateVariationAlertPayload & {
  schemaVersion: 1;
  client_submission_id: string;
};

export type OutboxVariationAlert = {
  clientSubmissionId: string;
  payload: OfflineVariationAlertPayload;
  createdAt: string;
  updatedAt: string;
  attempts: number;
  lastError: string | null;
};

export type VariationAlertDraft = {
  schemaVersion: 1;
  userId: number;
  clientSubmissionId: string;
  selectedTeamLeaderId: string;
  selectedEmployeeId: string;
  alertLevel: VariationAlertType | "";
  situation: VariationAlertReason | "";
  timeframe: VariationAlertSinceWhen | "";
  action: VariationAlertAction | "";
  otherSituation: string;
  positiveSituation: string;
  updatedAt: string;
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(WORKERS_STORE)) database.createObjectStore(WORKERS_STORE, { keyPath: "id" });
      if (!database.objectStoreNames.contains(MONTHLY_QUESTIONS_STORE)) {
        database.createObjectStore(MONTHLY_QUESTIONS_STORE, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(OUTBOX_STORE)) {
        const outbox = database.createObjectStore(OUTBOX_STORE, { keyPath: "clientSubmissionId" });
        outbox.createIndex("createdAt", "createdAt");
      }
      if (!database.objectStoreNames.contains(DRAFTS_STORE)) {
        database.createObjectStore(DRAFTS_STORE, { keyPath: "userId" });
      }
      if (!database.objectStoreNames.contains(VARIATION_ALERT_OUTBOX_STORE)) {
        const outbox = database.createObjectStore(VARIATION_ALERT_OUTBOX_STORE, {
          keyPath: "clientSubmissionId",
        });
        outbox.createIndex("createdAt", "createdAt");
      }
      if (!database.objectStoreNames.contains(VARIATION_ALERT_DRAFTS_STORE)) {
        database.createObjectStore(VARIATION_ALERT_DRAFTS_STORE, {
          keyPath: "userId",
        });
      }
    };
  });
}

export async function saveEvaluationDraft(draft: EvaluationDraft) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(DRAFTS_STORE, "readwrite");
    transaction.objectStore(DRAFTS_STORE).put(draft);
    await waitForTransaction(transaction);
  } finally {
    database.close();
  }
}

export async function getEvaluationDraft(userId: number): Promise<EvaluationDraft | null> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(DRAFTS_STORE, "readonly");
    const draft = await requestResult(transaction.objectStore(DRAFTS_STORE).get(userId)) as EvaluationDraft | undefined;
    return draft?.schemaVersion === 3 ? draft : null;
  } finally {
    database.close();
  }
}

export async function deleteEvaluationDraft(userId: number) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(DRAFTS_STORE, "readwrite");
    transaction.objectStore(DRAFTS_STORE).delete(userId);
    await waitForTransaction(transaction);
  } finally {
    database.close();
  }
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

export async function cacheMonthlyQuestions(
  questions: MonthlyEvaluationQuestion[],
) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(
      MONTHLY_QUESTIONS_STORE,
      "readwrite",
    );
    transaction.objectStore(MONTHLY_QUESTIONS_STORE).put({
      id: "active",
      questions,
      updatedAt: new Date().toISOString(),
    });
    await waitForTransaction(transaction);
  } finally {
    database.close();
  }
}

export async function getCachedMonthlyQuestions(): Promise<
  MonthlyEvaluationQuestion[]
> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(
      MONTHLY_QUESTIONS_STORE,
      "readonly",
    );
    const cached = await requestResult(
      transaction.objectStore(MONTHLY_QUESTIONS_STORE).get("active"),
    ) as { questions?: MonthlyEvaluationQuestion[] } | undefined;
    return cached?.questions ?? [];
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

export async function saveVariationAlertDraft(draft: VariationAlertDraft) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(VARIATION_ALERT_DRAFTS_STORE, "readwrite");
    transaction.objectStore(VARIATION_ALERT_DRAFTS_STORE).put(draft);
    await waitForTransaction(transaction);
  } finally {
    database.close();
  }
}

export async function getVariationAlertDraft(
  userId: number,
): Promise<VariationAlertDraft | null> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(VARIATION_ALERT_DRAFTS_STORE, "readonly");
    const draft = await requestResult(
      transaction.objectStore(VARIATION_ALERT_DRAFTS_STORE).get(userId),
    ) as VariationAlertDraft | undefined;
    return draft?.schemaVersion === 1 ? draft : null;
  } finally {
    database.close();
  }
}

export async function deleteVariationAlertDraft(userId: number) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(VARIATION_ALERT_DRAFTS_STORE, "readwrite");
    transaction.objectStore(VARIATION_ALERT_DRAFTS_STORE).delete(userId);
    await waitForTransaction(transaction);
  } finally {
    database.close();
  }
}

export async function queueVariationAlert(payload: OfflineVariationAlertPayload) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(VARIATION_ALERT_OUTBOX_STORE, "readwrite");
    const store = transaction.objectStore(VARIATION_ALERT_OUTBOX_STORE);
    const existing = await requestResult(
      store.get(payload.client_submission_id),
    ) as OutboxVariationAlert | undefined;
    const now = new Date().toISOString();
    store.put({
      clientSubmissionId: payload.client_submission_id,
      payload,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      attempts: existing?.attempts ?? 0,
      lastError: existing?.lastError ?? null,
    } satisfies OutboxVariationAlert);
    await waitForTransaction(transaction);
    notifyOutboxChange();
  } finally {
    database.close();
  }
}

export async function getQueuedVariationAlerts(): Promise<OutboxVariationAlert[]> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(VARIATION_ALERT_OUTBOX_STORE, "readonly");
    const records = await requestResult(
      transaction.objectStore(VARIATION_ALERT_OUTBOX_STORE).getAll(),
    ) as OutboxVariationAlert[];
    return records.sort((first, second) => first.createdAt.localeCompare(second.createdAt));
  } finally {
    database.close();
  }
}

export async function removeQueuedVariationAlert(clientSubmissionId: string) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(VARIATION_ALERT_OUTBOX_STORE, "readwrite");
    transaction.objectStore(VARIATION_ALERT_OUTBOX_STORE).delete(clientSubmissionId);
    await waitForTransaction(transaction);
    notifyOutboxChange();
  } finally {
    database.close();
  }
}

export async function recordVariationAlertQueueFailure(
  record: OutboxVariationAlert,
  error: string,
) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(VARIATION_ALERT_OUTBOX_STORE, "readwrite");
    transaction.objectStore(VARIATION_ALERT_OUTBOX_STORE).put({
      ...record,
      attempts: record.attempts + 1,
      lastError: error,
      updatedAt: new Date().toISOString(),
    } satisfies OutboxVariationAlert);
    await waitForTransaction(transaction);
    notifyOutboxChange();
  } finally {
    database.close();
  }
}

export async function getQueuedSubmissionCount() {
  const [evaluations, variationAlerts] = await Promise.all([
    getQueuedEvaluations(),
    getQueuedVariationAlerts(),
  ]);
  return evaluations.length + variationAlerts.length;
}
