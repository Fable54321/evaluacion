import { useMemo, useState, type FormEvent } from "react";
import { useForeignWorkers } from "../../Contexts/ForeignWorkersContext";
import SectionA, { ratingOptions, sectionACriteria, type Rating, type SectionARatings } from "./SectionA";
import SectionB, { sectionBQuestions, type SectionBAnswers } from "./SectionB";
import SectionC, { emptySectionCData, type SectionCData } from "./SectionC";
import { fetchWithAuth } from "../../Utils/fetchWithAuth";

type WorkType = "bodega" | "campo";
type Step = "setup" | "section-a" | "section-b" | "section-c" | "complete";

export default function Evaluacion() {
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
  const [sectionARatings, setSectionARatings] = useState<SectionARatings>({});
  const [sectionBAnswers, setSectionBAnswers] = useState<SectionBAnswers>({});
  const [sectionCData, setSectionCData] = useState<SectionCData>(emptySectionCData);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedEvaluationId, setSavedEvaluationId] = useState("");
  const [savedWeightedScore, setSavedWeightedScore] = useState("");

  const selectedEvaluator =
    evaluators.find((worker) => String(worker.id) === selectedEvaluatorId) ??
    evaluators[0];
  const selectedWorker =
    workers.find((worker) => String(worker.id) === selectedWorkerId) ??
    workers[0];
  const evaluatorValue = selectedEvaluator ? String(selectedEvaluator.id) : "";
  const workerValue = selectedWorker ? String(selectedWorker.id) : "";
  const beginEvaluation = (event: FormEvent) => {
    event.preventDefault();
    if (selectedEvaluator && selectedWorker && workType && positionTitle.trim()) setStep("section-a");
  };
  const saveEvaluation = async () => {
    if (!selectedEvaluator || !selectedWorker || !workType) return;
    try {
      setSaving(true);
      setSaveError("");
      const result = await fetchWithAuth<{ evaluationId: string; scores: { total_weighted_score: string } }>("/evaluation", {
        method: "POST",
        body: { evaluatorId: selectedEvaluator.id, evaluatedWorkerId: selectedWorker.id, workType, positionTitle: positionTitle.trim(), sectionA: sectionARatings, sectionB: sectionBAnswers, sectionC: sectionCData },
      });
      setSavedEvaluationId(result.evaluationId);
      setSavedWeightedScore(result.scores.total_weighted_score);
      setStep("complete");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "No se pudo guardar la evaluación.");
    } finally {
      setSaving(false);
    }
  };
  const startNextEvaluation = () => {
    setSelectedWorkerId("");
    setWorkType("");
    setPositionTitle("");
    setSectionARatings({});
    setSectionBAnswers({});
    setSectionCData({ ...emptySectionCData });
    setSaveError("");
    setSavedEvaluationId("");
    setSavedWeightedScore("");
    setStep("setup");
  };
  const sectionAResults: HighlightPoint[] = sectionACriteria
    .filter((criterion) => sectionARatings[criterion.id])
    .map((criterion) => ({ id: criterion.id, title: criterion.title, section: "A", rating: sectionARatings[criterion.id] as Rating }));
  const sectionBResults: HighlightPoint[] = sectionBQuestions
    .filter((question) => sectionBAnswers[question.id])
    .map((question) => ({ id: question.id, title: question.question, section: "B", rating: sectionBAnswers[question.id] }));
  const sectionCResults: HighlightPoint[] = sectionCData.finalRating ? [{ id: "performance_measurement", title: "Medida de rendimiento", section: "C", rating: sectionCData.finalRating }] : [];
  const allResults = [...sectionCResults, ...sectionAResults, ...sectionBResults];
  const scoreByRating: Record<Rating, number> = { needs_work: 0, good: 2, excellent: 3 };
  const sectionImpact = { C: 3, A: 2, B: 1 };
  const strongestPoints = allResults.filter((point) => scoreByRating[point.rating] >= 2).sort((first, second) => sectionImpact[second.section] - sectionImpact[first.section] || scoreByRating[second.rating] - scoreByRating[first.rating]).slice(0, 3);
  const weakestPoints = allResults.filter((point) => point.rating === "needs_work").sort((first, second) => sectionImpact[second.section] - sectionImpact[first.section]).slice(0, 3);
  const ratingLabel = (rating: Rating) => ratingOptions.find((option) => option.value === rating)?.label ?? rating;

  return (
    <main className="min-h-screen px-2 py-8 sm:px-6 font-primary">
      <article className="mx-auto flex w-full max-w-4xl flex-col items-center">
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
              label="Nombre del evaluador"
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
            <label htmlFor="position-title" className="flex flex-col gap-1 font-primary font-medium">Puesto<input id="position-title" name="positionTitle" type="text" value={positionTitle} onChange={(event) => setPositionTitle(event.target.value)} maxLength={150} required placeholder="Ej.: Cosechador, empacador…" className="rounded-lg border-2 border-gray-500 bg-tertiary/60 p-2.5 text-sm" /></label>
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
              disabled={!selectedEvaluator || !selectedWorker || !workType || !positionTitle.trim()}
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
              <div className="p-4 sm:p-5">
                {step === "section-a" ? (
                  <SectionA
                    ratings={sectionARatings}
                    onChange={setSectionARatings}
                    onBack={() => setStep("setup")}
                    onNext={() => setStep("section-b")}
                  />
                ) : step === "section-b" ? (
                  <SectionB
                    answers={sectionBAnswers}
                    workType={workType}
                    onChange={setSectionBAnswers}
                    onBack={() => setStep("section-a")}
                    onNext={() => setStep("section-c")}
                  />
                ) : step === "section-c" ? (
                  <SectionC data={sectionCData} workType={workType} onChange={setSectionCData} onBack={() => setStep("section-b")} onSubmit={saveEvaluation} saving={saving} error={saveError} />
                ) : (
                  <div className="py-8 text-center"><p className="text-xs font-bold uppercase tracking-widest text-secondary">Evaluación guardada</p><h3 className="mt-2 text-2xl font-semibold text-deepgreen">La evaluación se guardó correctamente</h3><p className="mt-4 text-4xl font-bold text-secondary">{savedWeightedScore} / 100</p><p className="mt-1 text-sm text-slate-500">A 40% · B 40% · C 20%</p>
                    <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
                      <ResultHighlights title="Puntos fuertes" points={strongestPoints} tone="strong" ratingLabel={ratingLabel} />
                      <ResultHighlights title="Puntos a mejorar" points={weakestPoints} tone="weak" ratingLabel={ratingLabel} />
                    </div>
                    <p className="mx-auto mt-6 max-w-lg text-sm text-slate-600">Número de evaluación: {savedEvaluationId}</p>
                    <button type="button" onClick={startNextEvaluation} className="button-primary mt-5">Nueva evaluación</button>
                  </div>
                )}
              </div>
            </section>
          )
        )}
      </article>
    </main>
  );
}

type WorkerOption = { id: number; surname: string; name: string; matricula: string };

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
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
}

function SearchableWorkerSelect({ label, id, value, onChange, options }: { label: string; id: string; value: string; onChange: (value: string) => void; options: WorkerOption[] }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(false);
  const selected = options.find((worker) => String(worker.id) === value);
  const normalizedQuery = normalizeSearch(query);
  const filteredWorkers = options.filter((worker) => normalizeSearch(`${worker.name} ${worker.surname} ${worker.surname} ${worker.name} ${worker.matricula}`).includes(normalizedQuery));

  return <div className="relative flex flex-col gap-1 font-primary font-medium">
    <label htmlFor={id}>{label}</label>
    <input id={id} type="search" autoComplete="off" value={editing ? query : selected ? formatWorkerName(selected) : ""} onFocus={() => { setEditing(true); setQuery(""); }} onChange={(event) => setQuery(event.target.value)} onBlur={() => setEditing(false)} disabled={!options.length} placeholder={options.length ? "Buscar por nombre o matrícula…" : "No hay trabajadores disponibles"} className="rounded-lg border-2 border-gray-500 bg-tertiary/60 p-2.5 text-sm" />
    {editing && <div className="absolute top-full z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
      {filteredWorkers.length ? filteredWorkers.map((worker) => <button key={worker.id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(String(worker.id)); setEditing(false); setQuery(""); }} className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-tertiary"><span>{formatWorkerName(worker)}</span><span className="shrink-0 font-bold text-secondary">{worker.matricula}</span></button>) : <p className="px-3 py-2 text-sm text-slate-500">No se encontraron trabajadores.</p>}
    </div>}
  </div>;
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

type HighlightPoint = { id: string; title: string; section: "A" | "B" | "C"; rating: Rating };
function ResultHighlights({ title, points, tone, ratingLabel }: { title: string; points: HighlightPoint[]; tone: "strong" | "weak"; ratingLabel: (rating: Rating) => string }) {
  return <section className={`rounded-xl border p-4 ${tone === "strong" ? "border-primary/40 bg-tertiary" : "border-amber-200 bg-amber-50"}`}><h4 className="font-secondary text-lg font-bold text-deepgreen">{title}</h4>{points.length ? <ul className="mt-3 space-y-2">{points.map((point) => <li key={`${point.section}-${point.id}`} className="rounded-lg bg-white px-3 py-2.5 text-sm"><p className="font-semibold leading-5 text-slate-900">{point.title}</p><div className="mt-2 flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-bold uppercase tracking-wide text-secondary">Sección {point.section}</span><span className={`rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-900 ${point.rating === "good" ? "font-bold" : "font-medium"}`}>{ratingLabel(point.rating)}</span></div></li>)}</ul> : <p className="mt-3 text-sm text-slate-600">Ningún punto identificado.</p>}</section>;
}
