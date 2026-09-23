import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  cacheMonthlyQuestions,
  getCachedMonthlyQuestions,
  type OfflineVariationAlertPayload,
} from "../Utils/offlineDb";
import { useAuth } from "./AuthContext";
import {
  submitVariationAlert,
  type VariationAlertSubmissionResult,
} from "../Utils/offlineSync";

export type Frequency = 1 | 2 | 3 | 4 | 5;

export type MonthlyAnswers = Record<string, Frequency>;

export type MonthlyEvaluationQuestion = {
  question_key: string;
  question_number: number;
  question_text: string;
  category: string | null;
  is_negative: boolean;
  is_active: boolean;
  is_yes_or_no: boolean;
};

/* =========================================================
   MONTHLY EVALUATIONS
========================================================= */

export type EvaluationSummary = {
  id: number;

  worker_user_id: number;
  evaluator_user_id: number;

  evaluation_date: string;

  comments: string | null;

  status: "draft" | "completed";

  completed_at: string | null;
  created_at: string;
  updated_at: string;

  worker_name: string;
  evaluator_name: string;

  answer_count: number;
};

export type EvaluationDetail = {
  id: number;

  worker_user_id: number;
  evaluator_user_id: number;

  evaluation_date: string;

  comments: string | null;

  status: "draft" | "completed";

  completed_at: string | null;
  created_at: string;
  updated_at: string;

  worker_name: string;
  evaluator_name: string;

  answers: MonthlyAnswers;
};

export type CreateEvaluationPayload = {
  worker_user_id: number;
  evaluator_user_id: number;

  evaluation_date?: string;

  comments?: string;

  answers: MonthlyAnswers;
};

type CreateEvaluationResponse = {
  message: string;

  evaluation: {
    id: number;

    worker_user_id: number;
    evaluator_user_id: number;

    evaluation_date: string;

    comments: string | null;

    status: "draft" | "completed";

    completed_at: string | null;
    created_at: string;
    updated_at: string;
  };
};

/* =========================================================
   PERFORMANCE VARIATION ALERTS
========================================================= */

export type VariationAlertType =
  | "red"
  | "yellow"
  | "positive";

export type VariationAlertReason =
  | "low_performance_or_distracted"
  | "lost_motivation_or_low_attitude"
  | "problems_with_coworkers"
  | "isolates_or_frequent_complaints"
  | "positive_action"
  | "other";

export type VariationAlertSinceWhen =
  | "today"
  | "this_week"
  | "since_arrival"
  | "other";

export type VariationAlertAction =
  // Keep earlier values so existing alerts and offline submissions remain readable.
  | "direct_conversation"
  | "field_observation_and_notes"
  | "repeated_suggestions"
  | "clear_task_reminders"
  | "active_follow_up"
  | "spoke_with_him_several_times"
  | "observing_him"
  | "other";

export type VariationAlertSummary = {
  id: number;

  leader_user_id: number;
  worker_user_id: number;

  alert_type: VariationAlertType;
  since_when: VariationAlertSinceWhen;

  other_reason: string | null;
  other_action: string | null;
  comments: string | null;

  created_by_user_id: number | null;

  created_at: string;
  updated_at: string;

  leader_name: string;
  worker_name: string;

  reasons: VariationAlertReason[];
  actions: VariationAlertAction[];
};

export type VariationAlertDetail = VariationAlertSummary & {
  created_by_name: string;
};

export type CreateVariationAlertPayload = {
  leader_user_id: number;
  worker_user_id: number;

  alert_type: VariationAlertType;
  since_when: VariationAlertSinceWhen;

  reasons: VariationAlertReason[];
  actions: VariationAlertAction[];

  other_reason?: string;
  other_since_when?: string;
  other_action?: string;
  comments?: string;
};

export type VariationAlertFilters = {
  worker_user_id?: number;
  leader_user_id?: number;
  alert_type?: VariationAlertType;
};

/* =========================================================
   CONTEXT
========================================================= */

type EvaluationContextValue = {
  evaluations: EvaluationSummary[];
  variationAlerts: VariationAlertSummary[];

  loading: boolean;
  saving: boolean;
  error: string;

  fetchEvaluations: (filters?: {
    worker_user_id?: number;
    evaluator_user_id?: number;
  }) => Promise<EvaluationSummary[]>;

  fetchEvaluationById: (
    evaluationId: number,
  ) => Promise<EvaluationDetail | null>;

  createEvaluation: (
    payload: CreateEvaluationPayload,
  ) => Promise<EvaluationDetail | null>;

  fetchVariationAlerts: (
    filters?: VariationAlertFilters,
  ) => Promise<VariationAlertSummary[]>;

  fetchVariationAlertById: (
    alertId: number,
  ) => Promise<VariationAlertDetail | null>;

  createVariationAlert: (
    payload: OfflineVariationAlertPayload,
  ) => Promise<VariationAlertSubmissionResult | null>;

  clearError: () => void;

  monthlyQuestions: MonthlyEvaluationQuestion[];

fetchMonthlyQuestions: () =>
  Promise<MonthlyEvaluationQuestion[]>;
};

const EvaluationContext =
  createContext<EvaluationContextValue | undefined>(
    undefined,
  );

const API_URL = import.meta.env.VITE_API_URL || "";

const EVALUATION_API = `${API_URL}/evaluation-new`;

const VARIATION_ALERT_API =
  `${EVALUATION_API}/variation-alerts`;

type EvaluationProviderProps = {
  children: ReactNode;
};

/* =========================================================
   API ERROR HELPER
========================================================= */

async function readApiError(response: Response) {
  try {
    const data = await response.json();

    if (
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof data.error === "string"
    ) {
      return data.error;
    }
  } catch {
    // Ignore invalid/non-JSON response.
  }

  return `Erreur API (${response.status})`;
}

/* =========================================================
   PROVIDER
========================================================= */

export function EvaluationProvider({
  children,
}: EvaluationProviderProps) {
  const { user, authChecked } = useAuth();
  const [evaluations, setEvaluations] =
    useState<EvaluationSummary[]>([]);

  const [variationAlerts, setVariationAlerts] =
    useState<VariationAlertSummary[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const variationAlertSubmissionInFlight = useRef(false);
  const monthlyQuestionsRequest = useRef<
    Promise<MonthlyEvaluationQuestion[]> | null
  >(null);

  const [monthlyQuestions, setMonthlyQuestions] =
  useState<MonthlyEvaluationQuestion[]>([]);

  const clearError = useCallback(() => {
    setError("");
  }, []);

  /* =======================================================
     MONTHLY EVALUATIONS
  ======================================================= */

  const fetchEvaluations = useCallback(
    async (filters?: {
      worker_user_id?: number;
      evaluator_user_id?: number;
    }): Promise<EvaluationSummary[]> => {
      try {
        setLoading(true);
        setError("");

        const searchParams = new URLSearchParams();

        if (filters?.worker_user_id !== undefined) {
          searchParams.set(
            "worker_user_id",
            String(filters.worker_user_id),
          );
        }

        if (filters?.evaluator_user_id !== undefined) {
          searchParams.set(
            "evaluator_user_id",
            String(filters.evaluator_user_id),
          );
        }

        const queryString = searchParams.toString();

        const response = await fetch(
          `${EVALUATION_API}${
            queryString ? `?${queryString}` : ""
          }`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        if (!response.ok) {
          throw new Error(
            await readApiError(response),
          );
        }

        const data: EvaluationSummary[] =
          await response.json();

        setEvaluations(data);

        return data;
      } catch (err) {
        console.error(
          "Error fetching evaluations:",
          err,
        );

        const message =
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement des évaluations.";

        setError(message);

        return [];
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchEvaluationById = useCallback(
    async (
      evaluationId: number,
    ): Promise<EvaluationDetail | null> => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${EVALUATION_API}/${evaluationId}`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        if (!response.ok) {
          throw new Error(
            await readApiError(response),
          );
        }

        const data: EvaluationDetail =
          await response.json();

        return data;
      } catch (err) {
        console.error(
          `Error fetching evaluation ${evaluationId}:`,
          err,
        );

        const message =
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement de l'évaluation.";

        setError(message);

        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchMonthlyQuestions = useCallback((): Promise<MonthlyEvaluationQuestion[]> => {
    if (monthlyQuestionsRequest.current) {
      return monthlyQuestionsRequest.current;
    }

    const request = (async () => {
      setLoading(true);

      const cachedQuestions = await getCachedMonthlyQuestions().catch(() => []);
      if (cachedQuestions.length > 0) {
        setMonthlyQuestions(cachedQuestions);
      }

      if (!navigator.onLine) {
        if (cachedQuestions.length === 0) {
          setError(
            "Conéctese a internet una vez para descargar las preguntas.",
          );
        } else {
          setError("");
        }
        setLoading(false);
        return cachedQuestions;
      }

      try {
        setError("");
        const response = await fetch(
          `${EVALUATION_API}/questions/monthly`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        if (!response.ok) {
          throw new Error(await readApiError(response));
        }

        const data: MonthlyEvaluationQuestion[] = await response.json();
        setMonthlyQuestions(data);
        await cacheMonthlyQuestions(data).catch((cacheError) => {
          console.warn("Could not cache monthly questions:", cacheError);
        });
        return data;
      } catch (err) {
        console.error("Error fetching monthly questions:", err);

        if (cachedQuestions.length > 0) {
          setError("");
          return cachedQuestions;
        }

        const message =
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement des questions.";
        setError(message);
        return [];
      } finally {
        setLoading(false);
      }
    })().finally(() => {
      monthlyQuestionsRequest.current = null;
    });

    monthlyQuestionsRequest.current = request;
    return request;
  }, []);

  useEffect(() => {
    if (!authChecked || !user) return;

    void fetchMonthlyQuestions();
    const refreshQuestions = () => {
      void fetchMonthlyQuestions();
    };
    window.addEventListener("online", refreshQuestions);
    return () => window.removeEventListener("online", refreshQuestions);
  }, [authChecked, user, fetchMonthlyQuestions]);

  const createEvaluation = useCallback(
    async (
      payload: CreateEvaluationPayload,
    ): Promise<EvaluationDetail | null> => {
      try {
        setSaving(true);
        setError("");

        const response = await fetch(
          EVALUATION_API,
          {
            method: "POST",

            credentials: "include",

            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify(payload),
          },
        );

        if (!response.ok) {
          throw new Error(
            await readApiError(response),
          );
        }

        const data: CreateEvaluationResponse =
          await response.json();

        const detailResponse = await fetch(
          `${EVALUATION_API}/${data.evaluation.id}`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        if (!detailResponse.ok) {
          throw new Error(
            await readApiError(detailResponse),
          );
        }

        const createdEvaluation: EvaluationDetail =
          await detailResponse.json();

        await fetchEvaluations();

        return createdEvaluation;
      } catch (err) {
        console.error(
          "Error creating evaluation:",
          err,
        );

        const message =
          err instanceof Error
            ? err.message
            : "Erreur lors de l'enregistrement de l'évaluation.";

        setError(message);

        return null;
      } finally {
        setSaving(false);
      }
    },
    [fetchEvaluations],
  );

  /* =======================================================
     VARIATION ALERTS
  ======================================================= */

  const fetchVariationAlerts = useCallback(
    async (
      filters?: VariationAlertFilters,
    ): Promise<VariationAlertSummary[]> => {
      try {
        setLoading(true);
        setError("");

        const searchParams = new URLSearchParams();

        if (filters?.worker_user_id !== undefined) {
          searchParams.set(
            "worker_user_id",
            String(filters.worker_user_id),
          );
        }

        if (filters?.leader_user_id !== undefined) {
          searchParams.set(
            "leader_user_id",
            String(filters.leader_user_id),
          );
        }

        if (filters?.alert_type !== undefined) {
          searchParams.set(
            "alert_type",
            filters.alert_type,
          );
        }

        const queryString =
          searchParams.toString();

        const response = await fetch(
          `${VARIATION_ALERT_API}${
            queryString ? `?${queryString}` : ""
          }`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        if (!response.ok) {
          throw new Error(
            await readApiError(response),
          );
        }

        const data: VariationAlertSummary[] =
          await response.json();

        setVariationAlerts(data);

        return data;
      } catch (err) {
        console.error(
          "Error fetching variation alerts:",
          err,
        );

        const message =
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement des alertes.";

        setError(message);

        return [];
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchVariationAlertById =
    useCallback(
      async (
        alertId: number,
      ): Promise<VariationAlertDetail | null> => {
        try {
          setLoading(true);
          setError("");

          const response = await fetch(
            `${VARIATION_ALERT_API}/${alertId}`,
            {
              method: "GET",
              credentials: "include",
            },
          );

          if (!response.ok) {
            throw new Error(
              await readApiError(response),
            );
          }

          const data: VariationAlertDetail =
            await response.json();

          return data;
        } catch (err) {
          console.error(
            `Error fetching variation alert ${alertId}:`,
            err,
          );

          const message =
            err instanceof Error
              ? err.message
              : "Erreur lors du chargement de l'alerte.";

          setError(message);

          return null;
        } finally {
          setLoading(false);
        }
      },
      [],
    );

  const createVariationAlert =
    useCallback(
      async (
        payload: OfflineVariationAlertPayload,
      ): Promise<VariationAlertSubmissionResult | null> => {
        if (variationAlertSubmissionInFlight.current) {
          return null;
        }

        variationAlertSubmissionInFlight.current = true;

        try {
          setSaving(true);
          setError("");

          return await submitVariationAlert(payload);
        } catch (err) {
          console.error(
            "Error creating variation alert:",
            err,
          );

          const message =
            err instanceof Error
              ? err.message
              : "Erreur lors de l'enregistrement de l'alerte.";

          setError(message);

          return null;
        } finally {
          variationAlertSubmissionInFlight.current = false;
          setSaving(false);
        }
      },
      [],
    );

  /* =======================================================
     CONTEXT VALUE
  ======================================================= */

  const value = useMemo<EvaluationContextValue>(
    () => ({
      evaluations,
      variationAlerts,
      monthlyQuestions,  
      loading,
      saving,
      error,

      fetchEvaluations,
      fetchEvaluationById,
      createEvaluation,

      fetchMonthlyQuestions,

      fetchVariationAlerts,
      fetchVariationAlertById,
      createVariationAlert,

      clearError,
    }),
    [
      evaluations,
      variationAlerts,
      monthlyQuestions,
      loading,
      saving,
      error,

      fetchEvaluations,
      fetchEvaluationById,
      createEvaluation,

      fetchMonthlyQuestions,

      fetchVariationAlerts,
      fetchVariationAlertById,
      createVariationAlert,

      clearError,
    ],
  );

  return (
    <EvaluationContext.Provider value={value}>
      {children}
    </EvaluationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useEvaluation() {
  const context = useContext(EvaluationContext);

  if (!context) {
    throw new Error(
      "useEvaluation must be used inside an EvaluationProvider.",
    );
  }

  return context;
}
