import { fetchWithAuth } from "./fetchWithAuth";
import {
  getQueuedEvaluations,
  getQueuedSubmissionCount,
  getQueuedVariationAlerts,
  queueEvaluation,
  queueVariationAlert,
  recordQueueFailure,
  recordVariationAlertQueueFailure,
  removeQueuedEvaluation,
  removeQueuedVariationAlert,
  type OfflineEvaluationPayload,
  type OfflineVariationAlertPayload,
} from "./offlineDb";

export type EvaluationSaveResponse = {
  message: string;
  evaluation: { id: number } & Record<string, unknown>;
};
export type SubmissionResult = { status: "synced"; response: EvaluationSaveResponse } | { status: "queued" };
export type VariationAlertSaveResponse = {
  message: string;
  deduplicated?: boolean;
  alert: { id: number } & Record<string, unknown>;
};
export type VariationAlertSubmissionResult =
  | { status: "synced"; response: VariationAlertSaveResponse }
  | { status: "queued" };

let synchronizationPromise: Promise<{
  synced: number;
  remaining: number;
  failed: number;
  lastError: string | null;
}> | null = null;

function isNetworkFailure(error: unknown) {
  if (!navigator.onLine) return true;
  if (error instanceof TypeError) return true;
  return error instanceof Error && /failed to fetch|networkerror|network request failed/i.test(error.message);
}

function toEvaluationApiPayload(payload: OfflineEvaluationPayload) {
  return {
    worker_user_id: payload.evaluatedWorkerId,
    evaluator_user_id: payload.evaluatorId,
    answers: payload.answers,
    comments: payload.comments,
  };
}

export async function submitEvaluation(payload: OfflineEvaluationPayload): Promise<SubmissionResult> {
  if (!navigator.onLine) {
    await queueEvaluation(payload);
    return { status: "queued" };
  }
  try {
    const response = await fetchWithAuth<EvaluationSaveResponse>("/evaluation-new", {
      method: "POST",
      body: toEvaluationApiPayload(payload),
    });
    return { status: "synced", response };
  } catch (error) {
    if (!isNetworkFailure(error)) throw error;
    await queueEvaluation(payload);
    return { status: "queued" };
  }
}

export async function submitVariationAlert(
  payload: OfflineVariationAlertPayload,
): Promise<VariationAlertSubmissionResult> {
  if (!navigator.onLine) {
    await queueVariationAlert(payload);
    return { status: "queued" };
  }

  try {
    const response = await fetchWithAuth<VariationAlertSaveResponse>(
      "/evaluation-new/variation-alerts",
      { method: "POST", body: payload },
    );
    return { status: "synced", response };
  } catch (error) {
    if (!isNetworkFailure(error)) throw error;
    await queueVariationAlert(payload);
    return { status: "queued" };
  }
}

async function synchronizeOutboxes() {
  if (!navigator.onLine) {
    return {
      synced: 0,
      remaining: await getQueuedSubmissionCount(),
      failed: 0,
      lastError: null as string | null,
    };
  }

  const records = await getQueuedEvaluations();
  let synced = 0;
  let failed = 0;
  let lastError: string | null = null;
  for (const record of records) {
    try {
      await fetchWithAuth<EvaluationSaveResponse>("/evaluation-new", {
        method: "POST",
        body: toEvaluationApiPayload(record.payload),
      });
      await removeQueuedEvaluation(record.clientSubmissionId);
      synced += 1;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Synchronization failed";
      await recordQueueFailure(record, lastError);
      failed += 1;
      if (isNetworkFailure(error)) break;
    }
  }

  if (navigator.onLine) {
    const alertRecords = await getQueuedVariationAlerts();
    for (const record of alertRecords) {
      try {
        await fetchWithAuth<VariationAlertSaveResponse>(
          "/evaluation-new/variation-alerts",
          { method: "POST", body: record.payload },
        );
        await removeQueuedVariationAlert(record.clientSubmissionId);
        synced += 1;
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Synchronization failed";
        await recordVariationAlertQueueFailure(record, lastError);
        failed += 1;
        if (isNetworkFailure(error)) break;
      }
    }
  }

  return {
    synced,
    remaining: await getQueuedSubmissionCount(),
    failed,
    lastError,
  };
}

export function syncEvaluationOutbox() {
  if (!synchronizationPromise) {
    synchronizationPromise = synchronizeOutboxes().finally(() => {
      synchronizationPromise = null;
    });
  }
  return synchronizationPromise;
}
