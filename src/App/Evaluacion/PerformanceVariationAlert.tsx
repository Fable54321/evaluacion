import { useMemo, useState, type FormEvent } from "react";
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

const [situations, setSituations] =
  useState<VariationAlertReason[]>([]);

const [timeframe, setTimeframe] =
  useState<VariationAlertSinceWhen | "">("");

const [actions, setActions] =
  useState<VariationAlertAction[]>([]);

const [otherSituation, setOtherSituation] =
  useState("");

const [formError, setFormError] =
  useState("");

const [submitted, setSubmitted] =
  useState(false);


  const selectedTeamLeader = teamLeaders.find(
    (worker) => String(worker.id) === selectedTeamLeaderId,
  );
  const selectedEmployee = employees.find(
    (worker) => String(worker.id) === selectedEmployeeId,
  );

 const toggleSelection = <T extends string>(
  value: T,
  selections: T[],
  setSelections: (nextSelections: T[]) => void,
) => {
  setSelections(
    selections.includes(value)
      ? selections.filter(
          (selection) => selection !== value,
        )
      : [...selections, value],
  );

  setFormError("");
  clearError();
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

  if (situations.length === 0) {
    setFormError(
      "Seleccione al menos una situación.",
    );
    return;
  }

  if (
    situations.includes("other") &&
    !otherSituation.trim()
  ) {
    setFormError(
      "Describa la otra situación.",
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
    leader_user_id: selectedTeamLeader.id,
    worker_user_id: selectedEmployee.id,

    alert_type: alertLevel,
    since_when: timeframe,

    reasons: situations,
    actions,

    other_reason: situations.includes("other")
      ? otherSituation.trim()
      : undefined,
  });

  if (!result) {
    return;
  }

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
            Alerta de variación de desempeño
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
            Formulario breve para reportar cambios en el desempeño o la actitud de un empleado,
            facilitar el seguimiento y ofrecer apoyo oportuno.
          </p>
         
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
              <div className="space-y-3">
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
              <div className="space-y-3">
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
                      onChange={() => setAlertLevel(option.value)}
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
            <p className="mt-2 text-sm text-slate-600">Puede marcar más de una opción.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {situationOptions.map((option) => (
                <CheckboxOption
                  key={option.value}
                  name="situation"
                  value={option.value}
                  label={option.label}
                  checked={situations.includes(option.value)}
                  onChange={() => toggleSelection(option.value, situations, setSituations)}
                />
              ))}
            </div>
            {situations.includes("other") && (
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
            <p className="mt-2 text-sm text-slate-600">Marque todas las acciones iniciales que ya realizó.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {actionOptions.map((option) => (
                <CheckboxOption
                  key={option.value}
                  name="manager-action"
                  value={option.value}
                  label={option.label}
                  checked={actions.includes(option.value)}
                  onChange={() => toggleSelection(option.value, actions, setActions)}
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
      Alerta enviada correctamente
    </p>

    <p className="mt-1 text-sm text-slate-700">
      La variación de desempeño fue registrada.
    </p>

    <button
      type="button"
      onClick={() => {
        setSelectedEmployeeId("");
        setAlertLevel("");
        setSituations([]);
        setTimeframe("");
        setActions([]);
        setOtherSituation("");
        setFormError("");
        clearError();
        setSubmitted(false);
      }}
      className="button-primary mt-4"
    >
      Nueva alerta
    </button>
  </div>
) : (
  <div className="flex justify-end">
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
  const selected = options.find((worker) => String(worker.id) === value);
  const normalizedQuery = normalizeSearch(query);
  const filteredWorkers = options.filter((worker) =>
    normalizeSearch(
      `${worker.name} ${worker.surname} ${worker.surname} ${worker.name} ${worker.matricula}`,
    ).includes(normalizedQuery),
  );

  return (
    <div className="relative flex flex-col gap-2 text-sm font-semibold text-slate-800">
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
        className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5 text-sm font-normal outline-none transition focus:border-secondary focus:ring-2 focus:ring-primary/30"
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
    <label htmlFor={id} className="flex flex-col gap-2 text-sm font-semibold text-slate-800">
      Matrícula
      <input
        id={id}
        value={value ?? ""}
        readOnly
        className="rounded-lg border-2 border-slate-300 bg-tertiary/60 px-3 py-2.5 text-sm font-bold text-secondary"
      />
    </label>
  );
}

function CheckboxOption({
  name,
  value,
  label,
  checked,
  onChange,
}: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 px-4 py-3 text-sm transition ${
        checked
          ? "border-primary bg-tertiary font-semibold text-deepgreen"
          : "border-slate-200 text-slate-800 hover:border-slate-400"
      }`}
    >
      <input
        type="checkbox"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 size-4 shrink-0 accent-secondary"
      />
      {label}
    </label>
  );
}
