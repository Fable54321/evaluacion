import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  useForeignWorkers,
  type Worker,
} from "../../Contexts/ForeignWorkersContext";

import {
  useEvaluation,
  type VariationAlertType,
  type VariationAlertReason,
  type VariationAlertSinceWhen,
  type VariationAlertAction,
} from "../../Contexts/evaluationContext";
import { useAuth } from "../../Contexts/AuthContext";
import {
  deleteVariationAlertDraft,
  getEvaluationDraft,
  getVariationAlertDraft,
  saveVariationAlertDraft,
  type VariationAlertDraft,
} from "../../Utils/offlineDb";
import { useEvaluationSync } from "../../Hooks/useEvaluationSync";
import { useOfflineReadiness } from "../../Hooks/useOfflineReadiness";

type AlertOption = {
  value: VariationAlertType;
  symbol: string;
  label: string;
  description: string;
  selectedClassName: string;
};

const alertOptions: AlertOption[] = [
  {
    value: "red",
    symbol: "🔴",
    label: "Alerta roja",
    description: "Bajó su rendimiento, perdió motivación o muestra una actitud preocupante.",
    selectedClassName: "border-red-500 bg-red-50 ring-red-100",
  },
  {
    value: "yellow",
    symbol: "🟡",
    label: "Alerta amarilla",
    description: "Observo cambios, me preocupa la situación o todavía tengo dudas.",
    selectedClassName: "border-amber-500 bg-amber-50 ring-amber-100",
  },
  {
    value: "positive",
    symbol: "🟢",
    label: "Variación positiva",
    description: "Se observa una mejora o una acción positiva destacada en su desempeño.",
    selectedClassName: "border-green-600 bg-green-50 ring-green-100",
  },
];

const situationOptions: Array<{
  value: VariationAlertReason;
  label: string;
}> = [
  {
    value: "low_performance_or_distracted",
    label: "Bajó su rendimiento o está distraído",
  },
  {
    value: "lost_motivation_or_low_attitude",
    label: "Perdió motivación o muestra una actitud apagada",
  },
  {
    value: "problems_with_coworkers",
    label: "Tiene problemas con compañeros",
  },
  {
    value: "isolates_or_frequent_complaints",
    label: "Se aísla o presenta quejas frecuentes",
  },
  {
    value: "positive_action",
    label: "Realizó una acción positiva destacada",
  },
  {
    value: "other",
    label: "Otro",
  },
];

const positiveSituationValues: VariationAlertReason[] = [
  "positive_action",
  "other",
];

const isPositiveSituation = (value: VariationAlertReason | "") =>
  value !== "" && positiveSituationValues.includes(value);

const isSituationAllowed = (
  alertLevel: VariationAlertType | "",
  value: VariationAlertReason | "",
) => {
  if (!alertLevel || !value || value === "other") return true;

  return alertLevel === "positive"
    ? isPositiveSituation(value)
    : !isPositiveSituation(value);
};

const timeframeOptions: Array<{
  value: VariationAlertSinceWhen;
  label: string;
}> = [
  {
    value: "today",
    label: "Hoy",
  },
  {
    value: "few_days",
    label: "Hace pocos días",
  },
  {
    value: "this_week",
    label: "Esta semana",
  },
  {
    value: "since_arrival",
    label: "Desde su llegada",
  },
  {
    value: "observation_unclear",
    label: "En observación / no preciso",
  },
];

const actionOptions: Array<{
  value: VariationAlertAction;
  label: string;
}> = [
  {
    value: "direct_conversation",
    label: "Conversación directa para motivar o corregir",
  },
  {
    value: "field_observation_and_notes",
    label: "Observación en campo y registro de notas",
  },
  {
    value: "repeated_suggestions",
    label: "Sugerencias repetidas (más de dos veces)",
  },
  {
    value: "clear_task_reminders",
    label: "Recordatorios claros sobre las tareas",
  },
  {
    value: "active_follow_up",
    label: "Seguimiento activo en progreso",
  },
];

export default function PerformanceVariationAlert() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { foreignWorkers, workersListLoading, error } = useForeignWorkers();

  const {
  createVariationAlert,
  saving,
  error: saveError,
  clearError,
} = useEvaluation();

  const teamLeaders = useMemo(
    () =>
      foreignWorkers.filter(
        (worker) => worker.job_id_1 === 6 || worker.job_id_2 === 6,
      ),
    [foreignWorkers],
  );
  const employees = useMemo(
    () =>
      foreignWorkers.filter(
        (worker) => worker.job_id_1 !== 6 && worker.job_id_2 !== 6,
      ),
    [foreignWorkers],
  );
  const [selectedTeamLeaderId, setSelectedTeamLeaderId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [alertLevel, setAlertLevel] =
  useState<VariationAlertType | "">("");

const [situation, setSituation] =
  useState<VariationAlertReason | "">("");

const [timeframe, setTimeframe] =
  useState<VariationAlertSinceWhen | "">("");

const [action, setAction] =
  useState<VariationAlertAction | "">("");

const [otherSituation, setOtherSituation] =
  useState("");

const [positiveSituation, setPositiveSituation] =
  useState("");

const [formError, setFormError] =
  useState("");

const [submitted, setSubmitted] =
  useState(false);

const [clientSubmissionId, setClientSubmissionId] =
  useState<string>(() => crypto.randomUUID());

const [saveStatus, setSaveStatus] =
  useState<"synced" | "queued">("synced");

const [draftLoaded, setDraftLoaded] =
  useState(false);

const [draftStatus, setDraftStatus] =
  useState<"idle" | "saving" | "saved">("idle");

const draftWriteRef = useRef<Promise<void>>(Promise.resolve());

const syncStatus = useEvaluationSync();
const offlineShellStatus = useOfflineReadiness();

const alertHasContent = Boolean(
  selectedTeamLeaderId ||
  selectedEmployeeId ||
  alertLevel ||
  situation ||
  timeframe ||
  action ||
  otherSituation.trim() ||
  positiveSituation.trim()
);


  const selectedTeamLeader = teamLeaders.find(
    (worker) => String(worker.id) === selectedTeamLeaderId,
  );
  const selectedEmployee = employees.find(
    (worker) => String(worker.id) === selectedEmployeeId,
  );

useEffect(() => {
  if (!user) return;

  let cancelled = false;
  void getVariationAlertDraft(user.id)
    .then((draft) => {
      if (cancelled) return;
      if (draft) {
        setSelectedTeamLeaderId(draft.selectedTeamLeaderId);
        setSelectedEmployeeId(draft.selectedEmployeeId);
        setAlertLevel(draft.alertLevel);
        setSituation(
          isSituationAllowed(draft.alertLevel, draft.situation)
            ? draft.situation
            : "",
        );
        setTimeframe(draft.timeframe);
        setAction(draft.action);
        setOtherSituation(draft.otherSituation);
        setPositiveSituation(draft.positiveSituation);
        setClientSubmissionId(draft.clientSubmissionId);
        setDraftStatus("saved");
      }
      setDraftLoaded(true);
    })
    .catch(() => {
      if (!cancelled) setDraftLoaded(true);
    });

  return () => {
    cancelled = true;
  };
}, [user]);

useEffect(() => {
  if (!user || !draftLoaded || submitted || !alertHasContent) return;

  const timeout = window.setTimeout(() => {
    setDraftStatus("saving");
    const draft: VariationAlertDraft = {
      schemaVersion: 1,
      userId: user.id,
      clientSubmissionId,
      selectedTeamLeaderId,
      selectedEmployeeId,
      alertLevel,
      situation,
      timeframe,
      action,
      otherSituation,
      positiveSituation,
      updatedAt: new Date().toISOString(),
    };

    const draftWrite = saveVariationAlertDraft(draft);
    draftWriteRef.current = draftWrite;
    void draftWrite
      .then(() => setDraftStatus("saved"))
      .catch(() => setDraftStatus("idle"));
  }, 300);

  return () => window.clearTimeout(timeout);
}, [
  user,
  draftLoaded,
  submitted,
  clientSubmissionId,
  selectedTeamLeaderId,
  selectedEmployeeId,
  alertLevel,
  situation,
  timeframe,
  action,
  otherSituation,
  positiveSituation,
  alertHasContent,
]);

const selectSituation = (value: VariationAlertReason) => {
  if (!isSituationAllowed(alertLevel, value)) return;

  if (situation === "positive_action" && value !== "positive_action") {
    setPositiveSituation("");
  }

  if (situation === "other" && value !== "other") {
    setOtherSituation("");
  }

  setSituation(value);
  setFormError("");
  clearError();
};

const selectAlertLevel = (value: VariationAlertType) => {
  setAlertLevel(value);

  if (!isSituationAllowed(value, situation)) {
    setSituation("");
    setOtherSituation("");
    setPositiveSituation("");
  }

  setFormError("");
  clearError();
};

const cancelVariationAlert = async () => {
  const confirmed = window.confirm(
    "¿Cancelar esta alerta? Se perderán las respuestas y los comentarios guardados.",
  );
  if (!confirmed) return;

  setSelectedTeamLeaderId("");
  setSelectedEmployeeId("");
  setAlertLevel("");
  setSituation("");
  setTimeframe("");
  setAction("");
  setOtherSituation("");
  setPositiveSituation("");
  setFormError("");
  clearError();
  setSaveStatus("synced");
  setDraftStatus("idle");
  setClientSubmissionId(crypto.randomUUID());
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (user) {
    await draftWriteRef.current.catch(() => undefined);
    await deleteVariationAlertDraft(user.id).catch(() => undefined);
    setDraftStatus("idle");
  }
};

const switchToMonthlyEvaluation = async () => {
  const alertStarted = !submitted && alertHasContent;
  const evaluationDraft = user
    ? await getEvaluationDraft(user.id).catch(() => null)
    : null;
  const evaluationStarted = Boolean(evaluationDraft);

  if (alertStarted || evaluationStarted) {
    const message = alertStarted && evaluationStarted
      ? "Hay una alerta y una evaluación en curso. La alerta se guardará y se abrirá el borrador de la evaluación. ¿Continuar?"
      : alertStarted
        ? "Hay una alerta en curso. Se guardará como borrador para que pueda continuarla después. ¿Cambiar a una evaluación?"
        : "Ya hay una evaluación en curso. Al cambiar, se abrirá ese borrador. ¿Continuar?";

    if (!window.confirm(message)) return;
  }

  if (alertStarted && user) {
    await draftWriteRef.current.catch(() => undefined);
    await saveVariationAlertDraft({
      schemaVersion: 1,
      userId: user.id,
      clientSubmissionId,
      selectedTeamLeaderId,
      selectedEmployeeId,
      alertLevel,
      situation,
      timeframe,
      action,
      otherSituation,
      positiveSituation,
      updatedAt: new Date().toISOString(),
    }).catch(() => undefined);
  }

  navigate("/evaluaciones-mensuales");
};

const submitAlert = async (
  event: FormEvent<HTMLFormElement>,
) => {
  event.preventDefault();

  setFormError("");
  clearError();

  if (!selectedTeamLeader) {
    setFormError(
      "Seleccione un jefe de equipo.",
    );
    return;
  }

  if (!selectedEmployee) {
    setFormError(
      "Seleccione un empleado.",
    );
    return;
  }

  if (!alertLevel) {
    setFormError(
      "Seleccione el tipo de alerta.",
    );
    return;
  }

  if (!situation) {
    setFormError(
      "Seleccione al menos una situación.",
    );
    return;
  }

  if (!isSituationAllowed(alertLevel, situation)) {
    setFormError(
      "Seleccione una situaciÃ³n compatible con el tipo de alerta.",
    );
    return;
  }

  if (
    situation === "other" &&
    !otherSituation.trim()
  ) {
    setFormError(
      "Describa la otra situación.",
    );
    return;
  }

  if (
    situation === "positive_action" &&
    !positiveSituation.trim()
  ) {
    setFormError(
      "Describa la situación positiva.",
    );
    return;
  }

  if (!timeframe) {
    setFormError(
      "Seleccione desde cuándo observa la situación.",
    );
    return;
  }

  const result = await createVariationAlert({
    schemaVersion: 1,
    client_submission_id: clientSubmissionId,
    leader_user_id: selectedTeamLeader.id,
    worker_user_id: selectedEmployee.id,

    alert_type: alertLevel,
    since_when: timeframe,

    reasons: [situation],
    actions: action ? [action] : [],

    other_reason: situation === "other"
      ? otherSituation.trim()
      : undefined,
    comments: situation === "positive_action"
      ? positiveSituation.trim()
      : undefined,
  });

  if (!result) {
    return;
  }

  if (user) {
    await deleteVariationAlertDraft(user.id).catch(() => undefined);
  }

  setSaveStatus(result.status);
  setDraftStatus("idle");
  setSubmitted(true);
};

  return (
    <main className="min-h-screen px-3 py-8 font-primary sm:px-6">
      <article className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-primary/30 bg-tertiary px-5 py-6 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-secondary">
            Empleados con más de 2 temporadas
          </p>
          <h1 className="mt-1 font-secondary text-2xl font-bold text-deepgreen sm:text-3xl">
            Alerta de desempeño
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
            Formulario breve para reportar cambios en el desempeño o la actitud de un empleado,
            facilitar el seguimiento y ofrecer apoyo oportuno.
          </p>
          <button
            type="button"
            onClick={() => void switchToMonthlyEvaluation()}
            className="mt-4 rounded-lg border border-secondary bg-white px-4 py-2 text-sm font-bold text-secondary transition hover:bg-tertiary"
          >
            Iniciar evaluación mensual
          </button>
          <OfflineStatus
            shellStatus={offlineShellStatus}
            syncStatus={syncStatus}
          />
          {draftStatus !== "idle" && !submitted && (
            <p aria-live="polite" className="mt-2 text-xs font-semibold text-slate-600">
              {draftStatus === "saving"
                ? "Guardando borrador…"
                : "Borrador guardado en este dispositivo"}
            </p>
          )}
        </header>

        <form onSubmit={submitAlert} className="space-y-8 p-5 sm:p-8">
          <section aria-labelledby="employee-heading">
            <SectionHeading number="1" id="employee-heading">
              Jefe de equipo y empleado
            </SectionHeading>
            {workersListLoading && (
              <p className="mt-4 text-sm text-slate-600">Cargando trabajadores…</p>
            )}
            {error && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700"
              >
                {error}
              </p>
            )}
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <div className="min-w-0 space-y-3">
                <SearchableWorkerSelect
                  id="team-leader"
                  label="Nombre del jefe de equipo"
                  value={selectedTeamLeaderId}
                  onChange={setSelectedTeamLeaderId}
                  options={teamLeaders}
                />
                <ReadOnlyMatricula
                  id="team-leader-matricula"
                  value={selectedTeamLeader?.matricula}
                />
              </div>
              <div className="min-w-0 space-y-3">
                <SearchableWorkerSelect
                  id="employee"
                  label="Nombre del empleado"
                  value={selectedEmployeeId}
                  onChange={setSelectedEmployeeId}
                  options={employees}
                />
                <ReadOnlyMatricula
                  id="employee-matricula"
                  value={selectedEmployee?.matricula}
                />
              </div>
            </div>
          </section>

          <fieldset>
            <legend className="w-full">
              <SectionHeading number="2">Tipo de alerta</SectionHeading>
            </legend>
            <p className="mt-2 text-sm text-slate-600">Seleccione el nivel que mejor describe la variación observada.</p>
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {alertOptions.map((option) => {
                const selected = alertLevel === option.value;
                return (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer gap-3 rounded-xl border-2 p-4 transition hover:border-slate-400 ${
                      selected
                        ? `${option.selectedClassName} ring-2`
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="alert-level"
                      value={option.value}
                      checked={selected}
                      onChange={() => selectAlertLevel(option.value)}
                      className="sr-only"
                    />
                    <span aria-hidden="true" className="text-xl">{option.symbol}</span>
                    <span>
                      <span className="block text-sm font-bold text-slate-900">{option.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-600">{option.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="w-full">
              <SectionHeading number="3">¿Qué está pasando?</SectionHeading>
            </legend>
            <p className="mt-2 text-sm text-slate-600">Seleccione una opción.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 max-w-full">
              {situationOptions.map((option) => {
                const disabled = !isSituationAllowed(alertLevel, option.value);

                return (
                  <SingleChoiceOption
                    key={option.value}
                    name="situation"
                    value={option.value}
                    label={option.label}
                    checked={situation === option.value}
                    disabled={disabled}
                    onChange={() => selectSituation(option.value)}
                  />
                );
              })}
            </div>
            {situation === "positive_action" && (
              <label htmlFor="positive-situation" className="mt-3 block text-sm font-semibold text-slate-800">
                Describa la situación positiva
                <textarea
                  id="positive-situation"
                  name="positive-situation"
                  rows={3}
                  maxLength={1000}
                  value={positiveSituation}
                  onChange={(event) => {
                    setPositiveSituation(event.target.value);
                    setFormError("");
                    clearError();
                  }}
                  placeholder="Explique brevemente la mejora o acción positiva observada."
                  className="mt-2 block w-full resize-y rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5 text-sm font-normal outline-none transition focus:border-secondary focus:ring-2 focus:ring-primary/30"
                />
              </label>
            )}
            {situation === "other" && (
              <label htmlFor="other-situation" className="mt-3 block text-sm font-semibold text-slate-800">
                Describa la otra situación
              <textarea
  id="other-situation"
  name="other-situation"
  rows={3}
  maxLength={1000}
  value={otherSituation}
  onChange={(event) => {
    setOtherSituation(event.target.value);
    setFormError("");
    clearError();
  }}
  placeholder="Explique brevemente qué está observando."
  className="mt-2 block w-full resize-y rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5 text-sm font-normal outline-none transition focus:border-secondary focus:ring-2 focus:ring-primary/30"
/>
              </label>
            )}
          </fieldset>

          <fieldset>
            <legend className="w-full">
              <SectionHeading number="4">¿Desde cuándo?</SectionHeading>
            </legend>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {timeframeOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 text-sm font-semibold transition ${
                    timeframe === option.value
                      ? "border-primary bg-tertiary text-deepgreen"
                      : "border-slate-200 text-slate-800 hover:border-slate-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="timeframe"
                    value={option.value}
                    checked={timeframe === option.value}
                    onChange={() => setTimeframe(option.value)}
                    className="size-4 accent-secondary"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="w-full">
              <SectionHeading number="5">¿Qué intentaste como jefe?</SectionHeading>
            </legend>
            <p className="mt-2 text-sm text-slate-600">Seleccione la acción inicial que realizó.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {actionOptions.map((option) => (
                <SingleChoiceOption
                  key={option.value}
                  name="manager-action"
                  value={option.value}
                  label={option.label}
                  checked={action === option.value}
                  onChange={() => {
                    setAction(option.value);
                    setFormError("");
                    clearError();
                  }}
                />
              ))}
            </div>
          </fieldset>

          {(formError || saveError) && (
  <p
    role="alert"
    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
  >
    {formError || saveError}
  </p>
)}

{submitted ? (
  <div className="rounded-xl border border-primary/40 bg-tertiary px-5 py-5">
    <p className="font-secondary text-lg font-bold text-deepgreen">
      {saveStatus === "queued"
        ? "Alerta guardada en este dispositivo"
        : "Alerta enviada correctamente"}
    </p>

    <p className="mt-1 text-sm text-slate-700">
      {saveStatus === "queued"
        ? "Se enviará automáticamente cuando vuelva la conexión."
        : "La alerta de desempeño fue registrada."}
    </p>

    <button
      type="button"
      onClick={() => {
        if (user) void deleteVariationAlertDraft(user.id);
        setSelectedEmployeeId("");
        setAlertLevel("");
        setSituation("");
        setTimeframe("");
        setAction("");
        setOtherSituation("");
        setPositiveSituation("");
        setFormError("");
        clearError();
        setSaveStatus("synced");
        setDraftStatus("idle");
        setClientSubmissionId(crypto.randomUUID());
        setSubmitted(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      className="button-primary mt-4"
    >
      Nueva alerta
    </button>
  </div>
) : (
  <div className="flex items-center justify-between gap-3">
    <button
      type="button"
      onClick={() => void cancelVariationAlert()}
      disabled={saving}
      className="button-secondary"
    >
      Cancelar
    </button>

    <button
      type="submit"
      disabled={saving}
      className="button-primary"
    >
      {saving
        ? "Guardando…"
        : "Enviar alerta"}
    </button>
  </div>
)}
        </form>
      </article>
    </main>
  );
}

function OfflineStatus({
  shellStatus,
  syncStatus,
}: {
  shellStatus: ReturnType<typeof useOfflineReadiness>;
  syncStatus: ReturnType<typeof useEvaluationSync>;
}) {
  const { online, pendingCount, syncing, syncError, synchronize } = syncStatus;
  const shellReady = shellStatus === "ready";
  const message = !online
    ? `Sin conexión${pendingCount ? ` · ${pendingCount} envío${pendingCount === 1 ? "" : "s"} pendiente${pendingCount === 1 ? "" : "s"}` : ""}`
    : syncing
      ? "Sincronizando envíos…"
      : syncError
        ? `Error de sincronización${pendingCount ? ` · ${pendingCount} pendiente${pendingCount === 1 ? "" : "s"}` : ""}`
        : pendingCount
          ? `${pendingCount} envío${pendingCount === 1 ? "" : "s"} pendiente${pendingCount === 1 ? "" : "s"}`
          : shellReady
            ? "Lista para trabajar sin conexión"
            : "Conexión disponible";
  const appearance = !online
    ? "border-amber-300 bg-amber-50 text-amber-950"
    : syncError
      ? "border-red-200 bg-red-50 text-red-800"
      : syncing || pendingCount
        ? "border-blue-200 bg-blue-50 text-blue-900"
        : "border-primary/50 bg-white text-deepgreen";

  return (
    <aside
      aria-live="polite"
      className={`mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${appearance}`}
    >
      <span className="flex items-center gap-2">
        <span
          className={`size-2.5 rounded-full ${
            !online
              ? "bg-amber-500"
              : syncError
                ? "bg-red-500"
                : syncing || pendingCount
                  ? "bg-blue-500"
                  : "bg-primary"
          }`}
        />
        {message}
      </span>
      {online && pendingCount > 0 && !syncing && (
        <button
          type="button"
          onClick={() => void synchronize()}
          className="rounded-md border border-current px-3 py-1 font-bold"
        >
          Reintentar
        </button>
      )}
    </aside>
  );
}

function SectionHeading({
  number,
  id,
  children,
}: {
  number: string;
  id?: string;
  children: string;
}) {
  return (
    <span id={id} className="flex items-center gap-3 font-secondary text-lg font-bold text-deepgreen">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary font-primary text-sm text-white">
        {number}
      </span>
      {children}
    </span>
  );
}

function titleCaseName(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es")
    .replace(/(^|[\s'-])\p{L}/gu, (letter) => letter.toLocaleUpperCase("es"));
}

function formatWorkerName(worker: Worker) {
  return `${titleCaseName(worker.surname)} ${titleCaseName(worker.name)}`;
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
}

function SearchableWorkerSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Worker[];
}) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = options.find((worker) => String(worker.id) === value);
  const normalizedQuery = normalizeSearch(query);
  const filteredWorkers = options.filter((worker) =>
    normalizeSearch(
      `${worker.name} ${worker.surname} ${worker.surname} ${worker.name} ${worker.matricula}`,
    ).includes(normalizedQuery),
  );

  return (
    <div className="relative flex min-w-0 flex-col gap-2 text-sm font-semibold text-slate-800">
      <label htmlFor={id}>{label}</label>
      <input
        ref={inputRef}
        id={id}
        type="search"
        autoComplete="off"
        value={editing ? query : selected ? formatWorkerName(selected) : ""}
        onFocus={() => {
          setEditing(true);
          setQuery("");
        }}
        onChange={(event) => setQuery(event.target.value)}
        onBlur={() => setEditing(false)}
        disabled={!options.length}
        placeholder={
          options.length
            ? "Buscar por nombre o matrícula…"
            : "No hay trabajadores disponibles"
        }
        className="w-full min-w-0 rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5 text-sm font-normal outline-none transition focus:border-secondary focus:ring-2 focus:ring-primary/30"
      />
      {editing && (
        <div className="absolute top-full z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
          {filteredWorkers.length ? (
            filteredWorkers.map((worker) => (
              <button
                key={worker.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(String(worker.id));
                  setEditing(false);
                  setQuery("");
                  inputRef.current?.blur();
                }}
                className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm font-medium hover:bg-tertiary"
              >
                <span>{formatWorkerName(worker)}</span>
                <span className="shrink-0 font-bold text-secondary">
                  {worker.matricula}
                </span>
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-sm font-normal text-slate-500">
              No se encontraron trabajadores.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ReadOnlyMatricula({ id, value }: { id: string; value?: string }) {
  return (
    <label htmlFor={id} className="flex min-w-0 flex-col gap-2 text-sm font-semibold text-slate-800">
      Matrícula
      <input
        id={id}
        value={value ?? ""}
        readOnly
        className="w-full min-w-0 rounded-lg border-2 border-slate-300 bg-tertiary/60 px-3 py-2.5 text-sm font-bold text-secondary"
      />
    </label>
  );
}

function SingleChoiceOption({
  name,
  value,
  label,
  checked,
  disabled = false,
  onChange,
}: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-lg border-2 px-4 py-3 text-sm transition ${
        disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-70"
          : checked
          ? "cursor-pointer border-primary bg-tertiary font-semibold text-deepgreen"
          : "cursor-pointer border-slate-200 text-slate-800 hover:border-slate-400"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="mt-0.5 size-4 shrink-0 accent-secondary disabled:cursor-not-allowed"
      />
      {label}
    </label>
  );
}
