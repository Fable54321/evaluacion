import { ratingOptions, type Rating } from "./ratings";

const crops = [
  "Apio",
  "Chile pimiento",
  "Coliflor",
  "Lechuga romana",
  "Lechuga bola",
  "Lechuga rizada",
  "Coles de Bruselas",
  "Repollo",
  "Repollo plano",
  "Col (repollo) de Saboya",
  "Zucchini",
  "Corazón de romana",
  "Otro",
];
const campoOnlyCrops = new Set([
  "Apio",
  "Lechuga romana",
  "Lechuga bola",
  "Lechuga rizada",
  "Col (repollo) de Saboya",
  "Corazón de romana",
]);
const tasks = [
  "Cosecha",
  "Empaque (campo)",
  "Empaque (bodega)",
  "Ensamblador de cajas",
  "Plantación",
  "Esquivada",
  "Conductor de maquinaria",
  "Fletero",
  "Deshierbada",
  "Piedra",
  "Piochada",
  "Otro",
];
const bodegaTasks = new Set([
  "Empaque (bodega)",
  "Ensamblador de cajas",
  "Esquivada",
  "Otro",
]);
const fieldClass =
  "mt-1 block w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-secondary focus:ring-2 focus:ring-primary/30";

function getLocalDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export type SectionCData = {
  evaluationDate: string;
  fieldNumber: string;
  crop: string;
  otherCrop: string;
  weatherConditions: string;
  terrainConditions: string;
  harvestNumber: "1" | "2" | "3" | "";
  task: string;
  otherTask: string;
  taskSpecification: string;
  quantity: string;
  unit: string;
  observations: string;
  finalRating: Rating | "";
};

// eslint-disable-next-line react-refresh/only-export-components
export const emptySectionCData: SectionCData = {
  evaluationDate: getLocalDate(),
  fieldNumber: "",
  crop: "",
  otherCrop: "",
  weatherConditions: "",
  terrainConditions: "",
  harvestNumber: "",
  task: "",
  otherTask: "",
  taskSpecification: "",
  quantity: "",
  unit: "",
  observations: "",
  finalRating: "",
};

type Props = {
  data: SectionCData;
  workType: "bodega" | "campo";
  onChange: (data: SectionCData) => void;
  onBack: () => void;
  onSubmit: () => void | Promise<void>;
  saving: boolean;
  error: string;
  submitLabel?: string;
};

export default function SectionC({
  data,
  workType,
  onChange,
  onBack,
  onSubmit,
  saving,
  error,
  submitLabel = "Finalizar evaluación",
}: Props) {
  const update = <K extends keyof SectionCData>(
    key: K,
    value: SectionCData[K],
  ) => onChange({ ...data, [key]: value });
  const availableCrops =
    workType === "bodega"
      ? crops.filter((crop) => !campoOnlyCrops.has(crop))
      : crops;
  const availableTasks =
    workType === "bodega"
      ? tasks.filter((task) => bodegaTasks.has(task))
      : tasks;
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit();
      }}
      className="space-y-6"
    >
      <header className="rounded-lg border-l-4 border-primary bg-tertiary p-4 text-sm text-slate-700">
        <p className="text-xs font-bold uppercase tracking-widest text-secondary">
          Sección B
        </p>
        <h3 className="mt-1 font-secondary text-lg font-bold text-deepgreen">
          Medida de rendimiento
        </h3>
        <p className="mt-1">
          Mida la prestación real del empleado durante un periodo consecutivo de
          15 minutos. Evalúe a los empleados que trabajan en la misma tarea, en
          el mismo campo y durante la misma semana.
        </p>
      </header>
      <fieldset className="space-y-4">
        <legend className="font-secondary text-lg font-bold text-deepgreen">
          B.1. Condiciones de evaluación
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Fecha"
            name="evaluationDate"
            type="date"
            value={data.evaluationDate}
            onChange={(value) => update("evaluationDate", value)}
            required
          />
          {workType === "campo" && (
            <TextField
              label="Número de campo"
              name="fieldNumber"
              value={data.fieldNumber}
              onChange={(value) => update("fieldNumber", value)}
            placeholder="Ej.: 12"
            maxLength={50}
            />
          )}
        </div>
        <ChoiceGrid
          title="Tipo de cultivo"
          name="crop"
          options={availableCrops}
          value={data.crop}
          onChange={(value) =>
            onChange({
              ...data,
              crop: value,
              otherCrop: value === "Otro" ? (data.otherCrop ?? "") : "",
            })
          }
        />
        {data.crop === "Otro" && (
          <label className="block text-sm font-semibold text-gray-800">
            Otro tipo de cultivo
            <input
              type="text"
              name="otherCrop"
              value={data.otherCrop ?? ""}
              onChange={(event) => update("otherCrop", event.target.value)}
              placeholder="Especifique el tipo de cultivo"
              maxLength={100}
              required
              className=" mt-1 block w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-secondary focus:ring-2 focus:ring-primary/30"
            />
          </label>
        )}
        {workType === "campo" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Condiciones meteorológicas"
              name="weatherConditions"
              value={data.weatherConditions}
              onChange={(value) => update("weatherConditions", value)}
              placeholder="Ej.: soleado, lluvia, nublado…"
              maxLength={200}
            />
            <TextField
              label="Condiciones del terreno"
              name="terrainConditions"
              value={data.terrainConditions}
              onChange={(value) => update("terrainConditions", value)}
              placeholder="Ej.: subida, lodo, plano…"
              maxLength={200}
            />
          </div>
        )}
        <ChoiceGrid
          title="Número de cosecha"
          name="harvestNumber"
          options={["1", "2", "3"]}
          labels={{ "1": "1ra", "2": "2da", "3": "3era" }}
          value={data.harvestNumber}
          onChange={(value) =>
            update("harvestNumber", value as SectionCData["harvestNumber"])
          }
        />
        <ChoiceGrid
          title="Tarea"
          name="task"
          options={availableTasks}
          value={data.task}
          onChange={(value) => update("task", value)}
        />
        {data.task === "Otro" && (
          <TextField
            label="Otra tarea"
            name="otherTask"
            value={data.otherTask}
            onChange={(value) => update("otherTask", value)}
            placeholder="Especifique la tarea"
            maxLength={150}
            required
          />
        )}
      </fieldset>
      <fieldset className="rounded-lg border border-gray-200 p-4">
        <legend className="px-2 font-secondary text-lg font-bold text-deepgreen">
          B.2. Medida
        </legend>
        <p className="mb-4 text-sm text-slate-600">
          Por un periodo de 15 minutos, indique la cantidad realizada por el
          empleado.
        </p>
        <div className="mb-4">
          <TextField
            label="Especificación de la tarea"
            name="taskSpecification"
            value={data.taskSpecification}
            onChange={(value) => update("taskSpecification", value)}
            placeholder="especifica la tarea"
            maxLength={300}
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_1.25fr]">
          <div>
            <p className="text-sm font-semibold text-gray-800">Duración</p>
            <div className="mt-1 flex min-h-11 items-center rounded-lg border-2 border-gray-200 bg-gray-50 px-3 text-sm font-bold text-secondary">
              15 minutos
            </div>
          </div>
          <TextField
            label="Cantidad"
            name="quantity"
            type="number"
            inputMode="decimal"
            value={data.quantity}
            onChange={(value) => update("quantity", value)}
            placeholder="0.5"
            min="0.5"
            max="1000000"
            step="0.5"
            required
          />
          <TextField
            label="Unidad de medida"
            name="unit"
            value={data.unit}
            onChange={(value) => update("unit", value)}
            placeholder="Ej.: cajas, metros, pasos"
            maxLength={50}
            required
          />
        </div>
      </fieldset>
      <label className="block font-secondary text-lg font-bold text-deepgreen">
        B.3. Observaciones
        <textarea
          name="observations"
          rows={4}
          value={data.observations}
          onChange={(event) => update("observations", event.target.value)}
          className={`${fieldClass} resize-y font-primary font-normal`}
          placeholder="Si el empleado no se pudo evaluar, explique por qué. Añada cualquier observación pertinente."
          maxLength={2000}
        />
      </label>
      <fieldset className="rounded-lg border border-gray-200 p-4">
        <legend className="px-2 font-secondary text-lg font-bold text-deepgreen">
          Calificación de rendimiento
        </legend>
        <p className="mb-3 text-sm text-slate-600">
          Seleccione la valoración que corresponde al rendimiento medido.
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {ratingOptions.map((option) => (
            <label
              key={option.value}
              className={`rating-option ${data.finalRating === option.value ? "rating-option-selected" : ""}`}
            >
              <input
                type="radio"
                name="section-b-final-rating"
                value={option.value}
                checked={data.finalRating === option.value}
                onChange={() => update("finalRating", option.value)}
                required
                className="size-4 accent-secondary"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
        >
          {error}
        </p>
      )}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={saving}
          className="button-secondary"
        >
          Anterior
        </button>
        <button type="submit" disabled={saving} className="button-primary">
          {saving ? "Guardando…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

type TextFieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: "numeric" | "decimal";
  placeholder?: string;
  required?: boolean;
  min?: string;
  max?: string;
  step?: string;
  maxLength?: number;
};
function TextField({ label, onChange, ...inputProps }: TextFieldProps) {
  return (
    <label className="text-sm font-semibold text-gray-800">
      {label}
      <input
        {...inputProps}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClass}
      />
    </label>
  );
}

type ChoiceGridProps = {
  title: string;
  name: string;
  options: string[];
  labels?: Record<string, string>;
  value: string;
  onChange: (value: string) => void;
};
function ChoiceGrid({
  title,
  name,
  options,
  labels,
  value,
  onChange,
}: ChoiceGridProps) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-gray-800">
        {title}
      </legend>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => (
          <label
            key={option}
            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${value === option ? "border-secondary bg-primary/15 font-semibold text-deepgreen" : "border-gray-300 hover:bg-tertiary"}`}
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              required
              className="size-4 accent-secondary"
            />
            {labels?.[option] ?? option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
