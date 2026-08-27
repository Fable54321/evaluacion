import { fetchWithAuth } from "./fetchWithAuth";
import { getQueuedEvaluations, queueEvaluation, recordQueueFailure, removeQueuedEvaluation, type OfflineEvaluationPayload } from "./offlineDb";

export type EvaluationSaveResponse = { evaluationId: string; scores: { total_weighted_score: string }; deduplicated: boolean };
export type SubmissionResult = { status: "synced"; response: EvaluationSaveResponse } | { status: "queued" };

function isNetworkFailure(error: unknown) {
  if (!navigator.onLine) return true;
  if (error instanceof TypeError) return true;
  return error instanceof Error && /failed to fetch|networkerror|network request failed/i.test(error.message);
}

export async function submitEvaluation(payload: OfflineEvaluationPayload): Promise<SubmissionResult> {
  if (!navigator.onLine) {
    await queueEvaluation(payload);
    return { status: "queued" };
  }
  try {
    const response = await fetchWithAuth<EvaluationSaveResponse>("/evaluation", { method: "POST", body: payload });
    return { status: "synced", response };
  } catch (error) {
    if (!isNetworkFailure(error)) throw error;
    await queueEvaluation(payload);
    return { status: "queued" };
  }
}

export async function syncEvaluationOutbox() {
  if (!navigator.onLine) return { synced: 0, remaining: (await getQueuedEvaluations()).length };
  const records = await getQueuedEvaluations();
  let synced = 0;
  for (const record of records) {
    try {
      await fetchWithAuth<EvaluationSaveResponse>("/evaluation", { method: "POST", body: record.payload });
      await removeQueuedEvaluation(record.clientSubmissionId);
      synced += 1;
    } catch (error) {
      await recordQueueFailure(record, error instanceof Error ? error.message : "Synchronization failed");
      if (isNetworkFailure(error)) break;
    }
  }
  return { synced, remaining: (await getQueuedEvaluations()).length };
}
