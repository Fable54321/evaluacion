import { useState } from "react";

type AlertLevel = "red" | "yellow" | "green";
type Timeframe = "today" | "few_days" | "this_week" | "since_arrival" | "unsure";

type AlertOption = {
  value: AlertLevel;
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
    value: "green",
    symbol: "🟢",
    label: "Variación positiva",
    description: "Se observa una mejora o una acción positiva destacada en su desempeño.",
    selectedClassName: "border-green-600 bg-green-50 ring-green-100",
  },
];

const situationOptions = [
  { value: "lower_performance", label: "Bajó su rendimiento o está distraído" },
  { value: "low_motivation", label: "Perdió motivación o muestra una actitud apagada" },
  { value: "coworker_issues", label: "Tiene problemas con compañeros" },
  { value: "isolation_or_complaints", label: "Se aísla o presenta quejas frecuentes" },
  { value: "positive_action", label: "Realizó una acción positiva destacada" },
  { value: "other", label: "Otro" },
] as const;

const timeframeOptions: { value: Timeframe; label: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "few_days", label: "Hace pocos días" },
  { value: "this_week", label: "Esta semana" },
  { value: "since_arrival", label: "Desde su llegada" },
  { value: "unsure", label: "En observación / no preciso" },
];

const actionOptions = [
  { value: "direct_conversation", label: "Conversación directa para motivar o corregir" },
  { value: "field_observation", label: "Observación en campo y registro de notas" },
  { value: "repeated_suggestions", label: "Sugerencias repetidas (más de dos veces)" },
  { value: "task_reminders", label: "Recordatorios claros sobre las tareas" },
  { value: "active_follow_up", label: "Seguimiento activo en progreso" },
] as const;

export default function PerformanceVariationAlert() {
  const [alertLevel, setAlertLevel] = useState<AlertLevel | "">("");
  const [situations, setSituations] = useState<string[]>([]);
  const [timeframe, setTimeframe] = useState<Timeframe | "">("");
  const [actions, setActions] = useState<string[]>([]);

  const toggleSelection = (
    value: string,
    selections: string[],
    setSelections: (nextSelections: string[]) => void,
  ) => {
    setSelections(
      selections.includes(value)
        ? selections.filter((selection) => selection !== value)
        : [...selections, value],
    );
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
          <p className="mt-4 inline-flex rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
            Borrador local · este formulario todavía no se envía
          </p>
        </header>

        <form onSubmit={(event) => event.preventDefault()} className="space-y-8 p-5 sm:p-8">
          <section aria-labelledby="employee-heading">
            <SectionHeading number="1" id="employee-heading">
              Identificación del empleado
            </SectionHeading>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TextField id="employee-name" label="Nombre del empleado" placeholder="Nombre y apellido" />
              <TextField id="employee-number" label="Matrícula" placeholder="Número de matrícula" />
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

          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            La acción de envío se añadirá cuando se defina el destino de estos reportes.
          </div>
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

function TextField({ id, label, placeholder }: { id: string; label: string; placeholder: string }) {
  return (
    <label htmlFor={id} className="flex flex-col gap-2 text-sm font-semibold text-slate-800">
      {label}
      <input
        id={id}
        name={id}
        type="text"
        autoComplete="off"
        placeholder={placeholder}
        className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5 text-sm font-normal outline-none transition focus:border-secondary focus:ring-2 focus:ring-primary/30"
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
