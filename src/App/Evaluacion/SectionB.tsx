import type { Rating } from "./ratings";
import { useState } from "react";

export type SectionBAnswers = Record<string, Rating>;
export type QuestionPolarity = "positive" | "negative";
const behaviorRatingOptions: Array<{ value: Rating; label: string }> = [
  { value: "needs_work", label: "Nunca" },
  { value: "good", label: "A veces" },
  { value: "excellent", label: "Siempre" },
];
const negativeQuestionNumbers = new Set([1, 2, 9, 13, 14, 15, 16, 17, 18, 28, 29, 33]);
// eslint-disable-next-line react-refresh/only-export-components
export const sectionBQuestions = [
  "¿El empleado llega tarde para tomar el bus?",
  "¿El empleado olvida su equipo de trabajo al momento de presentarse?",
  "¿El empleado llega preparado a su trabajo según las condiciones meteorológicas?",
  "¿El empleado parece motivado para su día de trabajo?",
  "¿El empleado muestra una actitud positiva hacia sus colegas?",
  "¿El empleado muestra una actitud positiva hacia su supervisor?",
  "¿El empleado muestra una actitud positiva hacia la empresa?",
  "¿El empleado muestra un aumento de su rendimiento?",
  "¿El empleado muestra desaprobación al cambiar de tipo de trabajo?",
  "¿El empleado ayuda a sus compañeros en dificultades?",
  "¿El empleado es voluntario para realizar tareas adicionales?",
  "¿El empleado está dispuesto a trabajar horas adicionales?",
  "¿El empleado se queja de sus compañeros?",
  "¿El empleado se queja de su supervisor?",
  "¿El empleado se queja del trabajo que realiza?",
  "¿El empleado se queja de la empresa?",
  "¿El empleado incita a los demás a trabajar más lento?",
  "¿El empleado realiza acciones inseguras que podrian causar accidentes?",
  "¿El empleado escucha y cumple las instrucciones de su supervisor?",
  "¿El empleado mantiene los campos limpios?",
  "¿El empleado mantiene los vehículos limpios?",
  "¿El empleado tiene una buena actitud?",
  "¿El empleado evita tomar riesgos inútiles?",
  "¿El empleado mantiene un buen rendimiento?",
  "¿El empleado respeta las reglas y políticas de la finca?",
  "¿El empleado brinda un trabajo de calidad?",
  "¿El empleado cuida su material de trabajo?",
  "¿El empleado distrae constantemente a sus compañeros de trabajo?",
  "¿El empleado hace comentarios sexuales, irrespetuosos o agresivos hacia otros compañeros?",
  "¿El empleado sigue el ritmo de los demás?",
  "¿El empleado muestra voluntad de aprender?",
  "¿El empleado puede realizar su trabajo de manera independiente?",
  "¿El empleado necesita ser vigilado?",
  "¿El empleado permite al grupo alcanzar sus objetivos?",
  "¿El empleado cuida su trabajo y lo realiza con responsabilidad?",
  "¿Estoy feliz de tener al empleado en mi grupo?",
].map((question, index) => ({
  id: `question_${index + 1}`,
  question,
  campoOnly: [2, 3, 15, 20, 21, 28, 29].includes(index + 1),
  polarity: (negativeQuestionNumbers.has(index + 1) ? "negative" : "positive") as QuestionPolarity,
}));

type Props = {
  answers: SectionBAnswers;
  workType: "bodega" | "campo";
  onChange: (answers: SectionBAnswers) => void;
  onBack: () => void;
  onNext: () => void;
};
export default function SectionB({
  answers,
  workType,
  onChange,
  onBack,
  onNext,
}: Props) {
  const [warning, setWarning] = useState("");
  const [firstMissingQuestionId, setFirstMissingQuestionId] = useState("");
  const questions = sectionBQuestions.filter(
    (question) => !question.campoOnly || workType === "campo",
  );
  const groups = [
    { id: "A.1", title: "Conductas positivas", polarity: "positive" as const },
    { id: "A.2", title: "Conductas negativas", polarity: "negative" as const },
  ];
  return (
    <>
      <div className="border-b border-primary/30 pb-3">
        <p className="text-xs font-bold uppercase tracking-widest text-secondary">
          Sección A
        </p>
        <h4 className="mt-1 text-xl font-semibold text-slate-950">Preguntas</h4>
        <p className="mt-1 text-sm text-slate-600">
          Seleccione una valoración para cada pregunta.
        </p>
      </div>
      <div className="mt-5 space-y-8">
        {groups.map((group) => {
          const groupQuestions = questions.filter((question) => question.polarity === group.polarity);
          return <section key={group.id} aria-labelledby={`section-${group.id}`}>
            <div className="mb-3 rounded-lg border-l-4 border-primary bg-tertiary p-3">
              <h5 id={`section-${group.id}`} className="font-secondary text-lg font-bold text-deepgreen">{group.id}. {group.title}</h5>

            </div>
            <div className="space-y-3">{groupQuestions.map((question, index) => (
              <fieldset
                key={question.id}
                id={`section-a-${question.id}`}
                aria-invalid={firstMissingQuestionId === question.id}
                className={`scroll-mt-28 rounded-xl border p-4 ${firstMissingQuestionId === question.id ? "border-red-400 bg-red-50 ring-2 ring-red-200" : "border-slate-200"}`}
              >
                <legend className="sr-only">Pregunta {index + 1}</legend>
                <p className="text-sm font-medium leading-6 text-slate-800"><span className="mr-1 font-bold text-secondary">{index + 1}.</span>{question.question}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">{behaviorRatingOptions.map((option) => (
                  <label key={option.value} className={`rating-option ${answers[question.id] === option.value ? "rating-option-selected" : ""}`}>
                    <input type="radio" name={`section-a-${question.id}`} checked={answers[question.id] === option.value} onChange={() => { onChange({ ...answers, [question.id]: option.value }); setWarning(""); setFirstMissingQuestionId(""); }} className="size-4 accent-secondary" />
                    {option.label}
                  </label>
                ))}</div>
              </fieldset>
            ))}</div>
          </section>;
        })}
      </div>
      {warning && (
        <p
          role="alert"
          className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
        >
          {warning}
        </p>
      )}
      <div className="mt-5 flex items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="button-secondary">
          Anterior
        </button>
        <button
          type="button"
          onClick={() => {
            const firstMissingQuestion = questions.find(
              (question) => !answers[question.id],
            );
            if (firstMissingQuestion) {
              setWarning(
                "Debe completar todas las preguntas de la Sección A antes de continuar.",
              );
              setFirstMissingQuestionId(firstMissingQuestion.id);
              requestAnimationFrame(() => {
                const fieldset = document.getElementById(
                  `section-a-${firstMissingQuestion.id}`,
                );
                fieldset?.scrollIntoView({ behavior: "smooth", block: "start" });
                fieldset
                  ?.querySelector<HTMLInputElement>('input[type="radio"]')
                  ?.focus({ preventScroll: true });
              });
              return;
            }
            onNext();
          }}
          className="button-primary"
        >
          Siguiente
        </button>
      </div>
    </>
  );
}
