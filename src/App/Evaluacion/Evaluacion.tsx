import { useMemo, useState, type FormEvent } from "react";
import { useForeignWorkers } from "../../Contexts/ForeignWorkersContext";
import SectionA, { type SectionARatings } from "./SectionA";
import SectionB, { type SectionBAnswers } from "./SectionB";
import SectionC, { emptySectionCData, type SectionCData } from "./SectionC";

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
  const [step, setStep] = useState<Step>("setup");
  const [sectionARatings, setSectionARatings] = useState<SectionARatings>({});
  const [sectionBAnswers, setSectionBAnswers] = useState<SectionBAnswers>({});
  const [sectionCData, setSectionCData] = useState<SectionCData>(emptySectionCData);

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
    if (selectedEvaluator && selectedWorker && workType) setStep("section-c");
  };

  return (
    <main className="min-h-screen px-2 py-8 sm:px-6">
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
            <WorkerSelect
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
            <WorkerSelect
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
              disabled={!selectedEvaluator || !selectedWorker || !workType}
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
                  {selectedWorker.surname} {selectedWorker.name}
                </h2>
                <p className="text-sm text-slate-600">
                  Matrícula {selectedWorker.matricula} ·{" "}
                  {workType === "bodega" ? "Bodega" : "Campo"}
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
                  <SectionC data={sectionCData} workType={workType} onChange={setSectionCData} onBack={() => setStep("section-b")} onSubmit={() => setStep("complete")} />
                ) : (
                  <div className="py-8 text-center"><p className="text-xs font-bold uppercase tracking-widest text-secondary">Evaluación completada</p><h3 className="mt-2 text-2xl font-semibold text-deepgreen">Los datos están listos para guardar</h3><p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">La interfaz conserva las respuestas de las tres secciones. El envío al servidor se puede conectar cuando esté definido el endpoint.</p><button type="button" onClick={() => setStep("section-c")} className="button-secondary mt-5">Volver a la Sección C</button></div>
                )}
              </div>
            </section>
          )
        )}
      </article>
    </main>
  );
}

type WorkerOption = { id: number; surname: string; name: string };
function WorkerSelect({
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
  return (
    <label htmlFor={id} className="flex flex-col gap-1 font-medium font-primary">
      {label}
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={!options.length}
        className="rounded-lg border-2 border-gray-500 bg-tertiary/60 p-2.5 text-sm"
      >
        <option value="">
          {options.length ? "Seleccione…" : "No hay trabajadores disponibles"}
        </option>
        {options.map((worker) => (
          <option key={worker.id} value={worker.id}>
            {worker.surname} {worker.name}
          </option>
        ))}
      </select>
    </label>
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
