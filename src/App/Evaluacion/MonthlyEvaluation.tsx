import { useState } from "react";

export type Frequency = 1 | 2 | 3 | 4 | 5;
export type MonthlyAnswers = Record<string, Frequency>;

type Question = {
  id: string;
  number: number;
  text: string;
};

type QuestionGroup = {
  id: string;
  title: string;
  description?: string;
  negative?: boolean;
  questions: Question[];
};

const frequencyOptions: Array<{ value: Frequency; label: string }> = [
  { value: 1, label: "Nunca" },
  { value: 2, label: "Rara vez" },
  { value: 3, label: "A veces" },
  { value: 4, label: "Casi siempre" },
  { value: 5, label: "Siempre" },
];

const questionTexts = [
  "Se alinea con reglas y procesos.",
  "Trabaja según las expectativas del equipo.",
  "Muestra entusiasmo por pertenecer al equipo.",
  "Inicia la jornada con actitud positiva.",
  "Busca mejorar cada día.",
  "Demuestra intención de aprender.",
  "Recibe bien consejos y sugerencias.",
  "Escucha con atención cuando se le corrige.",
  "Aplica los consejos recibidos.",
  "Ajusta su trabajo después del feedback.",
  "Entiende claramente su rol.",
  "Realiza tareas sin explicaciones repetidas.",
  "Toma iniciativa y demuestra responsabilidad.",
  "Actúa sin esperar recordatorios.",
  "Cumple instrucciones de manera consistente.",
  "Mantiene ritmo estable de trabajo.",
  "Es puntual y constante.",
  "Contribuye positivamente al ambiente del equipo.",
  "Facilita la colaboración entre compañeros.",
  "Respeta la autoridad del jefe de equipo.",
  "Se adapta bien a cambios e instrucciones nuevas.",
  "Ajusta su forma de trabajar cuando es necesario.",
  "Muestra mejoras visibles desde el mes anterior.",
  "Su desempeño actual es mejor que el mes previo.",
  "Lo recomendarías para continuar en tu equipo.",
  "Considerás que aporta valor suficiente para mantenerse.",
  "Prefiere trabajar solo.",
  "Evita colaborar cuando puede.",
  "Se queja mientras trabaja.",
  "Expresa inconformidad frecuentemente.",
] as const;

const monthlyQuestions: Question[] = questionTexts.map((text, index) => ({
  id: `question_${index + 1}`,
  number: index + 1,
  text,
}));

const questionGroups: QuestionGroup[] = [
  {
    id: "alignment",
    title: "Categoría 1 — Alineación y actitud",
    questions: monthlyQuestions.slice(0, 4),
  },
  {
    id: "learning",
    title: "Categoría 2 — Aprendizaje y feedback",
    questions: monthlyQuestions.slice(4, 10),
  },
  {
    id: "performance",
    title: "Categoría 3 — Rol, responsabilidad y desempeño",
    questions: monthlyQuestions.slice(10, 22),
  },
  {
    id: "progress",
    title: "Categoría 4 — Progreso y continuidad",
    questions: monthlyQuestions.slice(22, 26),
  },
  {
    id: "negative",
    title: "Conductas negativas (invertidas)",
    description:
      "Estas preguntas se califican con la misma frecuencia, pero se invierten al calcular el resultado.",
    negative: true,
    questions: monthlyQuestions.slice(26),
  },
];

type Props = {
  answers: MonthlyAnswers;
  comments: string;
  onAnswersChange: (answers: MonthlyAnswers) => void;
  onCommentsChange: (comments: string) => void;
  onBack: () => void;
  onSubmit: () => void | Promise<void>;
  saving: boolean;
  error: string;
  printable?: boolean;
};

export default function MonthlyEvaluation({
  answers,
  comments,
  onAnswersChange,
  onCommentsChange,
  onBack,
  onSubmit,
  saving,
  error,
  printable = false,
}: Props) {
  const [warning, setWarning] = useState("");
  const [firstMissingQuestionId, setFirstMissingQuestionId] = useState("");

  const submit = () => {
    const firstMissingQuestion = monthlyQuestions.find(
      (question) => !answers[question.id],
    );
    if (firstMissingQuestion) {
      setWarning("Debe responder las 30 preguntas antes de finalizar.");
      setFirstMissingQuestionId(firstMissingQuestion.id);
      requestAnimationFrame(() => {
        const fieldset = document.getElementById(
          `monthly-${firstMissingQuestion.id}`,
        );
        fieldset?.scrollIntoView({ behavior: "smooth", block: "start" });
        fieldset
          ?.querySelector<HTMLInputElement>('input[type="radio"]')
          ?.focus({ preventScroll: true });
      });
      return;
    }
    void onSubmit();
  };

  return (
    <div>
      <header className="border-b border-primary/30 pb-5">
        <p className="text-xs font-bold uppercase tracking-widest text-secondary">
          Evaluación mensual
        </p>
        <h3 className="mt-1 font-secondary text-xl font-bold text-deepgreen">
          Empleados con 1–2 temporadas
        </h3>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          Esta evaluación permite medir el desempeño de los empleados con 1–2
          temporadas en la empresa. El objetivo es identificar fortalezas, áreas
          de mejora y la continuidad del empleado dentro del equipo.
        </p>
        <div className="mt-4 rounded-lg bg-slate-50 p-3">
          <p className="text-sm font-semibold text-slate-800">
            Indique la frecuencia con la que observa cada conducta.
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-700">
            {frequencyOptions.map((option) => (
              <span key={option.value}>
                <strong>{option.value}</strong> = {option.label}
              </span>
            ))}
          </div>
        </div>
      </header>

      <div className="mt-6 space-y-8">
        <h3 className="font-secondary text-xl font-bold text-deepgreen">
          Conductas positivas
        </h3>
        {questionGroups.map((group) => (
          <section key={group.id} aria-labelledby={`group-${group.id}`}>
            <div
              className={`mb-3 rounded-lg border-l-4 p-3 ${
                group.negative
                  ? "border-amber-500 bg-amber-50"
                  : "border-primary bg-tertiary"
              }`}
            >
              <h4
                id={`group-${group.id}`}
                className="font-secondary text-lg font-bold text-deepgreen"
              >
                {group.title}
              </h4>
              {group.description && (
                <p className="mt-1 text-xs leading-5 text-slate-700">
                  {group.description}
                </p>
              )}
            </div>

            <div className="space-y-3">
              {group.questions.map((question) => (
                <fieldset
                  key={question.id}
                  id={`monthly-${question.id}`}
                  aria-invalid={firstMissingQuestionId === question.id}
                  className={`scroll-mt-28 rounded-xl border p-4 ${
                    firstMissingQuestionId === question.id
                      ? "border-red-400 bg-red-50 ring-2 ring-red-200"
                      : "border-slate-200"
                  }`}
                >
                  <legend className="sr-only">Pregunta {question.number}</legend>
                  <p className="text-sm font-medium leading-6 text-slate-800">
                    <span className="mr-1 font-bold text-secondary">
                      {question.number}.
                    </span>
                    {question.text}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {frequencyOptions.map((option) => (
                      <label
                        key={option.value}
                        className={`rating-option ${
                          answers[question.id] === option.value
                            ? "rating-option-selected"
                            : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name={`monthly-${question.id}`}
                          value={option.value}
                          checked={answers[question.id] === option.value}
                          onChange={() => {
                            onAnswersChange({
                              ...answers,
                              [question.id]: option.value,
                            });
                            setWarning("");
                            setFirstMissingQuestionId("");
                          }}
                          className="size-4 accent-secondary"
                        />
                        <span>
                          <strong>{option.value}</strong>
                          <span className="block text-[0.65rem] font-medium leading-tight text-slate-600">
                            {option.label}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </section>
        ))}
      </div>

      <label className="mt-8 block font-secondary text-lg font-bold text-deepgreen">
        Comentarios adicionales
        <textarea
          name="comments"
          rows={6}
          value={comments}
          onChange={(event) => onCommentsChange(event.target.value)}
          maxLength={3000}
          placeholder="Añada fortalezas, áreas de mejora u otras observaciones pertinentes."
          className="mt-2 block w-full resize-y rounded-lg border-2 border-gray-300 bg-white px-3 py-2.5 font-primary text-sm font-normal text-gray-900 outline-none transition focus:border-secondary focus:ring-2 focus:ring-primary/30"
        />
      </label>

      {warning && (
        <p
          role="alert"
          className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
        >
          {warning}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
        >
          {error}
        </p>
      )}

      {!printable && (
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={saving}
            className="button-secondary"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="button-primary"
          >
            {saving ? "Guardando…" : "Finalizar evaluación"}
          </button>
        </div>
      )}
    </div>
  );
}
