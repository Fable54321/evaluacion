
import {
  createContext,
  useCallback,

  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Frequency = 1 | 2 | 3 | 4 | 5;

export type MonthlyAnswers = Record<string, Frequency>;

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

type EvaluationContextValue = {
  evaluations: EvaluationSummary[];

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

  clearError: () => void;
};

const EvaluationContext = createContext<EvaluationContextValue | undefined>(
  undefined,
);

/*
 * Adjust this if your frontend uses a different backend URL setup.
 *
 * Example:
 * VITE_API_URL=https://your-backend.onrender.com
 */
const API_URL = import.meta.env.VITE_API_URL || "";

const EVALUATION_API = `${API_URL}/evaluation-new`;

type EvaluationProviderProps = {
  children: ReactNode;
};

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
    // Ignore JSON parsing failure and use fallback below.
  }

  return `Erreur API (${response.status})`;
}

export function EvaluationProvider({
  children,
}: EvaluationProviderProps) {
  const [evaluations, setEvaluations] = useState<EvaluationSummary[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const clearError = useCallback(() => {
    setError("");
  }, []);

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
          `${EVALUATION_API}${queryString ? `?${queryString}` : ""}`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        if (!response.ok) {
          throw new Error(await readApiError(response));
        }

        const data: EvaluationSummary[] = await response.json();

        setEvaluations(data);

        return data;
      } catch (err) {
        console.error("Error fetching evaluations:", err);

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
          throw new Error(await readApiError(response));
        }

        const data: EvaluationDetail = await response.json();

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

  const createEvaluation = useCallback(
    async (
      payload: CreateEvaluationPayload,
    ): Promise<EvaluationDetail | null> => {
      try {
        setSaving(true);
        setError("");

        const response = await fetch(EVALUATION_API, {
          method: "POST",

          credentials: "include",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(await readApiError(response));
        }

        const data: CreateEvaluationResponse =
          await response.json();

        /*
         * The POST route currently returns only the evaluation header,
         * not the answer object.
         *
         * Fetch the freshly created complete evaluation so the caller
         * immediately receives exactly the same structure as GET /:id.
         */
        const detailResponse = await fetch(
          `${EVALUATION_API}/${data.evaluation.id}`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        if (!detailResponse.ok) {
          throw new Error(await readApiError(detailResponse));
        }

        const createdEvaluation: EvaluationDetail =
          await detailResponse.json();

        /*
         * Add the newly created evaluation to the local summary list.
         *
         * Since the POST response does not include worker_name and
         * evaluator_name, the safest approach is to refresh the list.
         */
        await fetchEvaluations();

        return createdEvaluation;
      } catch (err) {
        console.error("Error creating evaluation:", err);

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

  const value = useMemo<EvaluationContextValue>(
    () => ({
      evaluations,

      loading,
      saving,
      error,

      fetchEvaluations,
      fetchEvaluationById,
      createEvaluation,

      clearError,
    }),
    [
      evaluations,
      loading,
      saving,
      error,
      fetchEvaluations,
      fetchEvaluationById,
      createEvaluation,
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
