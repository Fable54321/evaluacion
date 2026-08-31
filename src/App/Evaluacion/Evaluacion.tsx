import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useForeignWorkers } from "../../Contexts/ForeignWorkersContext";
import SectionB, { type SectionBAnswers } from "./SectionB";
import SectionC, { emptySectionCData, type SectionCData } from "./SectionC";
import SectionPermanencia, { emptyPermanenceData, type PermanenceData } from "./SectionPermanencia";
import { submitEvaluation } from "../../Utils/offlineSync";
import {
  deleteEvaluationDraft,
  getEvaluationDraft,
  saveEvaluationDraft,
  type EvaluationDraft,
  type OfflineEvaluationPayload,
} from "../../Utils/offlineDb";
import { useEvaluationSync } from "../../Hooks/useEvaluationSync";
import { useOfflineReadiness } from "../../Hooks/useOfflineReadiness";
import { useAuth } from "../../Contexts/AuthContext";

type WorkType = "bodega" | "campo";
type Step = "setup" | "section-a" | "section-b" | "section-c" | "complete";

export default function Evaluacion() {
  const { user } = useAuth();
  const { foreignWorkers, workersListLoading, error } = useForeignWorkers();
  const evaluators = useMemo(
    () =>
      foreignWorkers.filter(
        (worker) => worker.job_id_1 === 6 || worker.job_id_2 === 6,
      ),
    [foreignWorkers],
  );
  const workers = useMemo(
    () =>
      foreignWorkers.filter(
        (worker) => worker.job_id_1 !== 6 && worker.job_id_2 !== 6,
      ),
    [foreignWorkers],
  );
  const [selectedEvaluatorId, setSelectedEvaluatorId] = useState("");
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [workType, setWorkType] = useState<WorkType | "">("");
  const [positionTitle, setPositionTitle] = useState("");
  const [step, setStep] = useState<Step>("setup");
  const [sectionBAnswers, setSectionBAnswers] = useState<SectionBAnswers>({});
  const [sectionCData, setSectionCData] =
    useState<SectionCData>(emptySectionCData);
  const [permanenceData, setPermanenceData] = useState<PermanenceData>(emptyPermanenceData);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [clientSubmissionId, setClientSubmissionId] = useState<string>(() =>
    crypto.randomUUID(),
  );
  const [saveStatus, setSaveStatus] = useState<"synced" | "queued">("synced");
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftStatus, setDraftStatus] = useState<"idle" | "saving" | "saved">("idle");
  const syncStatus = useEvaluationSync();
  const offlineShellStatus = useOfflineReadiness();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void getEvaluationDraft(user.id).then((draft) => {
      if (cancelled) return;
      if (draft) {
        setSelectedEvaluatorId(String(draft.evaluatorId));
        setSelectedWorkerId(String(draft.evaluatedWorkerId));
        setWorkType(draft.workType);
        setPositionTitle(draft.positionTitle);
        setSectionBAnswers(draft.sectionB);
        setSectionCData(draft.sectionC);
        setPermanenceData(draft.permanence);
        setClientSubmissionId(draft.clientSubmissionId);
        setStep(draft.step);
        setDraftStatus("saved");
      }
      setDraftLoaded(true);
    }).catch(() => {
      if (!cancelled) setDraftLoaded(true);
    });
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!user || !draftLoaded || step === "complete") return;
    const hasProgress = Boolean(
      selectedWorkerId || workType || positionTitle.trim() ||
      Object.keys(sectionBAnswers).length || sectionCData.finalRating ||
      permanenceData.recommendNextSeason,
    );
    if (!hasProgress) return;
    const timeout = window.setTimeout(() => {
      setDraftStatus("saving");
      const draft: EvaluationDraft = {
        userId: user.id,
        clientSubmissionId,
        evaluatorId: Number(selectedEvaluatorId || evaluators[0]?.id || 0),
        evaluatedWorkerId: Number(selectedWorkerId || workers[0]?.id || 0),
        workType: workType || "campo",
        positionTitle,
        sectionA: {},
        sectionB: sectionBAnswers,
        sectionC: sectionCData,
        permanence: permanenceData,
        step,
        updatedAt: new Date().toISOString(),
      };
      void saveEvaluationDraft(draft).then(() => setDraftStatus("saved"));
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [
    user, draftLoaded, step, selectedEvaluatorId, selectedWorkerId, workType,
    positionTitle, sectionBAnswers, sectionCData, permanenceData,
    clientSubmissionId, evaluators, workers,
  ]);

  useEffect(() => {
    if (step !== "setup") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const selectedEvaluator =
    evaluators.find((worker) => String(worker.id) === selectedEvaluatorId);
  const selectedWorker =
    workers.find((worker) => String(worker.id) === selectedWorkerId);
  const evaluatorValue = selectedEvaluator ? String(selectedEvaluator.id) : "";
  const workerValue = selectedWorker ? String(selectedWorker.id) : "";
  const beginEvaluation = (event: FormEvent) => {
    event.preventDefault();
    if (selectedEvaluator && selectedWorker && workType && positionTitle.trim())
      setStep("section-a");
  };
  const saveEvaluation = async () => {
    if (!selectedEvaluator || !selectedWorker || !workType) return;
    try {
      setSaving(true);
      setSaveError("");
      const payload: OfflineEvaluationPayload = {
        clientSubmissionId,
        evaluatorId: selectedEvaluator.id,
        evaluatedWorkerId: selectedWorker.id,
        workType,
        positionTitle: positionTitle.trim(),
        sectionA: {},
        sectionB: sectionBAnswers,
        sectionC: sectionCData,
        permanence: permanenceData,
      };
      const result = await submitEvaluation(payload);
      if (user) await deleteEvaluationDraft(user.id).catch(() => undefined);
      setSaveStatus(result.status);
      setDraftStatus("idle");
      setStep("complete");
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la evaluación.",
      );
    } finally {
      setSaving(false);
    }
  };
  const startNextEvaluation = () => {
    if (user) void deleteEvaluationDraft(user.id);
    setSelectedWorkerId("");
    setWorkType("");
    setPositionTitle("");
    setSectionBAnswers({});
    setSectionCData({ ...emptySectionCData });
    setPermanenceData({ ...emptyPermanenceData });
    setSaveError("");
    setSaveStatus("synced");
    setClientSubmissionId(crypto.randomUUID());
    setStep("setup");
  };
  return (
    <main className="min-h-screen px-2 py-8 sm:px-6 font-primary">
      <button
        type="button"
        onClick={() => window.print()}
        className="print-button fixed right-3 top-3 z-30 flex size-9 items-center justify-center rounded-lg border border-secondary bg-white text-secondary shadow-sm transition hover:bg-tertiary sm:right-5 sm:top-5"
        aria-label="Imprimir evaluación en blanco"
        title="Imprimir evaluación en blanco"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6z" />
        </svg>
      </button>
      <article className="mx-auto flex w-full max-w-4xl flex-col items-center">
        <OfflineReadinessNotice
          shellStatus={offlineShellStatus}
          workersReady={!workersListLoading && foreignWorkers.length > 0}
        />
        <SyncStatus status={syncStatus} />
        {draftStatus !== "idle" && (
          <p
            aria-live="polite"
            className="print-hide mb-3 w-[min(100%,800px)] text-right text-xs font-semibold text-slate-600"
          >
            {draftStatus === "saving"
              ? "Guardando borrador…"
              : "Borrador guardado en este dispositivo"}
          </p>
        )}
        <h1 className="text-center font-secondary text-2xl font-semibold text-deepgreen sm:text-3xl">
          Evaluación de rendimiento
        </h1>
        <p className="mt-1 text-center text-md text-slate-800">
          Mediados de temporada {new Date().getFullYear()}
        </p>
        {step === "setup" ? (
          <form
            onSubmit={beginEvaluation}
            className="mt-6 flex w-[min(100%,800px)] flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            {workersListLoading && (
              <p className="text-sm text-slate-600">Cargando trabajadores…</p>
            )}
            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700"
              >
                {error}
              </p>
            )}
            <SearchableWorkerSelect
              label="Nombre del evaluador | Jefe de equipo"
              id="evaluator"
              value={evaluatorValue}
              onChange={setSelectedEvaluatorId}
              options={evaluators}
            />
            <ReadOnlyMatricula
              id="evaluator-matricula"
              value={selectedEvaluator?.matricula}
            />
            <SearchableWorkerSelect
              label="Nombre de la persona evaluada"
              id="evaluated-worker"
              value={workerValue}
              onChange={setSelectedWorkerId}
              options={workers}
            />
            <ReadOnlyMatricula
              id="worker-matricula"
              value={selectedWorker?.matricula}
            />
            <label
              htmlFor="position-title"
              className="flex flex-col gap-1 font-primary font-medium"
            >
              Puesto
              <input
                id="position-title"
                name="positionTitle"
                type="text"
                value={positionTitle}
                onChange={(event) => setPositionTitle(event.target.value)}
                maxLength={150}
                required
                placeholder="Ej.: Cosechador, empacador…"
                className="rounded-lg border-2 border-gray-500 bg-tertiary/60 p-2.5 text-sm"
              />
            </label>
            <fieldset>
              <legend className="font-medium">Tipo de trabajo</legend>
              <div className="mt-2 flex flex-wrap gap-3">
                {(["bodega", "campo"] as const).map((type) => (
                  <label
                    key={type}
                    className={`flex min-w-32 cursor-pointer items-center gap-2 rounded-lg border-2 px-4 py-2.5 transition ${workType === type ? "border-primary bg-tertiary text-secondary" : "border-gray-400 bg-white"}`}
                  >
                    <input
                      type="radio"
                      name="workType"
                      checked={workType === type}
                      onChange={() => setWorkType(type)}
                      required
                      className="size-4 accent-secondary"
                    />
                    <span className="font-bold capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <button
              type="submit"
              disabled={
                !selectedEvaluator ||
                !selectedWorker ||
                !workType ||
                !positionTitle.trim()
              }
              className="button-primary mt-2 self-end"
            >
              Siguiente
            </button>
          </form>
        ) : (
          selectedWorker &&
          workType && (
            <section className="mt-6 w-[min(100%,800px)] rounded-xl border border-gray-200 bg-white shadow-sm">
              <header className="sticky top-0 z-10 rounded-t-xl border-b border-primary/30 bg-tertiary px-4 py-3 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                  Persona evaluada
                </p>
                <h2 className="mt-0.5 text-xl font-semibold text-slate-950">
                  {formatWorkerName(selectedWorker)}
                </h2>
                <p className="text-sm text-slate-600">
                  Matrícula {selectedWorker.matricula} ·{" "}
                  {workType === "bodega" ? "Bodega" : "Campo"} · {positionTitle}
                </p>
              </header>
              <div className="p-2 sm:p-5">
                {step === "section-a" ? (
                  <SectionB
                    answers={sectionBAnswers}
                    workType={workType}
                    onChange={setSectionBAnswers}
                    onBack={() => setStep("setup")}
                    onNext={() => setStep("section-b")}
                  />
                ) : step === "section-b" ? (
                  <SectionC
                    data={sectionCData}
                    workType={workType}
                    onChange={setSectionCData}
                    onBack={() => setStep("section-a")}
                    onSubmit={() => setStep("section-c")}
                    saving={false}
                    error=""
                    submitLabel="Siguiente"
                  />
                ) : step === "section-c" ? (
                  <SectionPermanencia data={permanenceData} onChange={setPermanenceData} onBack={() => setStep("section-b")} onSubmit={saveEvaluation} saving={saving} error={saveError} />
                ) : (
                  <div className="mx-auto max-w-xl py-8 text-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-secondary">Evaluación terminada</p>
                    <h3 className="mt-2 text-2xl font-semibold text-deepgreen">La evaluación se completó correctamente</h3>
                    {saveStatus === "queued" && (
                      <p className="mx-auto mt-2 max-w-xl rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
                        Se guardó en este dispositivo y se enviará automáticamente cuando vuelva la conexión.
                      </p>
                    )}
                    <div className="mt-7 space-y-4 text-left">
                      <section className={`rounded-xl border p-4 ${permanenceData.recommendNextSeason === "yes" ? "border-primary/40 bg-tertiary" : "border-amber-200 bg-amber-50"}`}>
                        <p className="text-xs font-bold uppercase tracking-wide text-secondary">Recomendación para la próxima temporada</p>
                        <p className="mt-2 text-2xl font-bold text-deepgreen">{permanenceData.recommendNextSeason === "yes" ? "Sí" : "No"}</p>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{permanenceData.explanation}</p>
                      </section>
                    </div>
                    <button
                      type="button"
                      onClick={startNextEvaluation}
                      className="button-primary mt-5"
                    >
                      Nueva evaluación
                    </button>
                  </div>
                )}
              </div>
            </section>
          )
        )}
      </article>
      <PrintEvaluation />
    </main>
  );
}

function PrintEvaluation() {
  const doNothing = () => undefined;

  return (
    <article className="print-evaluation" aria-hidden="true">
      <section className="print-section">
        <SectionB answers={{}} workType="campo" onChange={doNothing} onBack={doNothing} onNext={doNothing} />
      </section>
      <section className="print-section mt-8">
        <SectionC data={emptySectionCData} workType="campo" onChange={doNothing} onBack={doNothing} onSubmit={doNothing} saving={false} error="" />
      </section>
      <section className="print-section mt-8">
        <SectionPermanencia data={emptyPermanenceData} onChange={doNothing} onBack={doNothing} onSubmit={doNothing} saving={false} error="" />
      </section>
    </article>
  );
}

function OfflineReadinessNotice({
  shellStatus,
  workersReady,
}: {
  shellStatus: ReturnType<typeof useOfflineReadiness>;
  workersReady: boolean;
}) {
  const ready = shellStatus === "ready" && workersReady;
  const unavailable = shellStatus === "unavailable";
  const appearance = ready
    ? "border-primary bg-tertiary text-deepgreen"
    : unavailable
      ? "border-amber-300 bg-amber-50 text-amber-950"
      : "border-blue-200 bg-blue-50 text-blue-900";
  const message = ready
    ? "Aplicación lista para usar sin Wi-Fi"
    : unavailable
      ? "No se pudo preparar la aplicación para usar sin Wi-Fi"
      : "Preparando la aplicación para usar sin Wi-Fi…";

  return (
    <aside
      aria-live="polite"
      className={`print-hide mb-3 flex w-[min(100%,800px)] items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${appearance}`}
    >
      <span
        className={`size-2.5 shrink-0 rounded-full ${ready ? "bg-primary" : unavailable ? "bg-amber-500" : "bg-blue-500"}`}
      />
      {message}
    </aside>
  );
}

type WorkerOption = {
  id: number;
  surname: string;
  name: string;
  matricula: string;
};

function titleCaseName(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es")
    .replace(/(^|[\s'-])\p{L}/gu, (letter) => letter.toLocaleUpperCase("es"));
}

function formatWorkerName(worker: WorkerOption) {
  return `${titleCaseName(worker.surname)} ${titleCaseName(worker.name)}`;
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
}

function SearchableWorkerSelect({
  label,
  id,
  value,
  onChange,
  options,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: WorkerOption[];
}) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(false);
  const selected = options.find((worker) => String(worker.id) === value);
  const normalizedQuery = normalizeSearch(query);
  const filteredWorkers = options.filter((worker) =>
    normalizeSearch(
      `${worker.name} ${worker.surname} ${worker.surname} ${worker.name} ${worker.matricula}`,
    ).includes(normalizedQuery),
  );

  return (
    <div className="relative flex flex-col gap-1 font-primary font-medium">
      <label htmlFor={id}>{label}</label>
      <input
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
        className="rounded-lg border-2 border-gray-500 bg-tertiary/60 p-2.5 text-sm"
      />
      {editing && (
        <div className="absolute top-full z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
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
                }}
                className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-tertiary"
              >
                <span>{formatWorkerName(worker)}</span>
                <span className="shrink-0 font-bold text-secondary">
                  {worker.matricula}
                </span>
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-sm text-slate-500">
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
    <label htmlFor={id} className="flex flex-col gap-1 font-medium">
      Matrícula
      <input
        id={id}
        value={value ?? ""}
        readOnly
        className="rounded-lg border-2 border-gray-500 bg-tertiary/60 p-2.5 text-sm font-bold text-secondary"
      />
    </label>
  );
}

type EvaluationSyncStatus = ReturnType<typeof useEvaluationSync>;
function SyncStatus({ status }: { status: EvaluationSyncStatus }) {
  const {
    online,
    pendingCount,
    syncing,
    syncError,
    lastSyncedCount,
    synchronize,
  } = status;
  const appearance = !online
    ? "border-amber-300 bg-amber-50 text-amber-950"
    : syncError
      ? "border-red-200 bg-red-50 text-red-800"
      : syncing || pendingCount
        ? "border-blue-200 bg-blue-50 text-blue-900"
        : "border-primary/40 bg-white text-deepgreen";
  const message = !online
    ? `Sin conexión${pendingCount ? ` · ${pendingCount} evaluación${pendingCount === 1 ? "" : "es"} pendiente${pendingCount === 1 ? "" : "s"}` : ""}`
    : syncing
      ? "Sincronizando evaluaciones…"
      : syncError
        ? `${pendingCount} pendiente${pendingCount === 1 ? "" : "s"} · Error de sincronización`
        : pendingCount
          ? `${pendingCount} evaluación${pendingCount === 1 ? "" : "es"} pendiente${pendingCount === 1 ? "" : "s"}`
          : lastSyncedCount
            ? `${lastSyncedCount} evaluación${lastSyncedCount === 1 ? "" : "es"} sincronizada${lastSyncedCount === 1 ? "" : "s"}`
            : "Todas las evaluaciones están sincronizadas";
  return (
    <aside
      aria-live="polite"
      className={`print-hide mb-5 flex w-[min(100%,800px)] flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${appearance}`}
    >
      <span className="flex items-center gap-2">
        <span
          className={`size-2.5 rounded-full ${!online ? "bg-amber-500" : syncError ? "bg-red-500" : syncing || pendingCount ? "bg-blue-500" : "bg-primary"}`}
        />
        {message}
      </span>
      {online && pendingCount > 0 && !syncing && (
        <button
          type="button"
          onClick={() => void synchronize()}
          className="rounded-md border border-current px-3 py-1 text-xs font-bold"
        >
          Reintentar
        </button>
      )}
    </aside>
  );
}
