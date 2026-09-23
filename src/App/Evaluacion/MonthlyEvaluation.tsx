import { useEffect, useMemo, useState } from "react";

import {
  useEvaluation,
  type MonthlyAnswers,
} from "../../Contexts/evaluationContext";



const frequencyOptions = [
  { value: 1, label: "Nunca" },
  { value: 2, label: "Rara vez" },
  { value: 3, label: "A veces" },
  { value: 4, label: "Casi siempre" },
  { value: 5, label: "Siempre" },
] as const;

type Props = {
  answers: MonthlyAnswers;
  comments: string;
  onAnswersChange: (answers: MonthlyAnswers) => void;
  onCommentsChange: (comments: string) => void;
  onCancel: () => void;
  clearError: () => void;
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
  onCancel,
  clearError,
  onSubmit,
  saving,
  error,
  printable = false,
}: Props) {
  const [warning, setWarning] = useState("");
  const [firstMissingQuestionId, setFirstMissingQuestionId] =
    useState("");

  const {
    monthlyQuestions,
    fetchMonthlyQuestions,
  } = useEvaluation();

  useEffect(() => {
    if (monthlyQuestions.length === 0) {
      void fetchMonthlyQuestions();
    }
  }, [
    monthlyQuestions.length,
    fetchMonthlyQuestions,
  ]);

  const questionGroups = useMemo(() => {
    const groupDefinitions = [
      {
        id: "alignment",
        title: "Categoría 1 — Actitud",
      },
      {
        id: "learning",
        title: "Categoría 2 — Aprendizaje",
      },
      {
        id: "performance",
        title:
          "Categoría 3 — Responsabilidad",
      },
       {
        id: "negative",
        title: "Conductas negativas",
        
      },
      {
        id: "progress",
        title: "Categoría 4 — Progreso",
      },
     
    ];

    return groupDefinitions
      .map((group) => ({
        ...group,

        questions: monthlyQuestions.filter(
          (question) =>
            question.category === group.id,
        ),
      }))
      .filter((group) => group.questions.length > 0);
  }, [monthlyQuestions]);

  const submit = () => {
    const firstMissingQuestion =
      monthlyQuestions.find(
        (question) =>
          !answers[question.question_key],
      );

    if (firstMissingQuestion) {
      setWarning(
        `Debe responder las ${monthlyQuestions.length} preguntas antes de finalizar.`,
      );

      setFirstMissingQuestionId(
        firstMissingQuestion.question_key,
      );

      requestAnimationFrame(() => {
        const fieldset =
          document.getElementById(
            `monthly-${firstMissingQuestion.question_key}`,
          );

        fieldset?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        fieldset
          ?.querySelector<HTMLInputElement>(
            'input[type="radio"]',
          )
          ?.focus({
            preventScroll: true,
          });
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
          Esta evaluación permite medir el desempeño de los empleados con
          1–2 temporadas en la empresa. El objetivo es identificar
          fortalezas, áreas de mejora y la continuidad del empleado dentro
          del equipo.
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

      {monthlyQuestions.length === 0 ? (
        <p className="mt-6 text-sm text-slate-600">
          Cargando preguntas…
        </p>
      ) : (
        <div className="mt-6 space-y-8">
          {questionGroups.map((group) => {
            const isNegativeGroup =
              group.questions.some(
                (question) =>
                  question.is_negative,
              );
            const isYesOrNo = 
              group.questions.some(
                (question) => question.is_yes_or_no
              );  

            return (
              <section
                key={group.id}
                aria-labelledby={`group-${group.id}`}
              >
                <div
                  className={`mb-3 rounded-lg border-l-4 p-3 ${
                    isNegativeGroup
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
                  {isYesOrNo && 
                    <h5 className="text-[0.9rem]">
                      preguntas que se responden con sí o no
                    </h5>
                  }

                 
                </div>

                <div className="space-y-3">
                  {group.questions.map(
                    (question) => (
                      <fieldset
                        key={
                          question.question_key
                        }
                        id={`monthly-${question.question_key}`}
                        aria-invalid={
                          firstMissingQuestionId ===
                          question.question_key
                        }
                        className={`scroll-mt-28 rounded-xl border p-2 ${
                          firstMissingQuestionId ===
                          question.question_key
                            ? "border-red-400 bg-red-50 ring-2 ring-red-200"
                            : "border-slate-200"
                        }`}
                      >
                        <legend className="sr-only">
                          Pregunta{" "}
                          {
                            question.question_number
                          }
                        </legend>

                        <p className="text-sm font-medium leading-6 text-slate-800">
                          <span className="mr-1 font-bold text-secondary">
                            {
                              question.question_number
                            }
                            .
                          </span>

                          {
                            question.question_text
                          }
                        </p>

                 {!isYesOrNo ? (       
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                          {frequencyOptions.map(
                            (option) => (
                              <label
                                key={
                                  option.value
                                }
                                className={`rating-option ${
                                  answers[
                                    question
                                      .question_key
                                  ] ===
                                  option.value
                                    ? "rating-option-selected"
                                    : ""
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`monthly-${question.question_key}`}
                                  value={
                                    option.value
                                  }
                                  checked={
                                    answers[
                                      question
                                        .question_key
                                    ] ===
                                    option.value
                                  }
                                  onChange={() => {
                                    onAnswersChange(
                                      {
                                        ...answers,
                                        [question.question_key]:
                                          option.value,
                                      },
                                    );

                                    setWarning(
                                      "",
                                    );

                                    setFirstMissingQuestionId(
                                      "",
                                    );

                                    clearError();
                                  }}
                                  className="size-4 accent-secondary"
                                />

                                <span>
                                  <strong>
                                    {
                                      option.value
                                    }
                                  </strong>

                                  <span className="block text-[0.65rem] font-medium leading-tight text-slate-600">
                                    {
                                      option.label
                                    }
                                  </span>
                                </span>
                              </label>
                            ),
                          )}
                        </div>
                 ) : (
                   <div className="flex items-center gap-3 mt-3 ">
                    <label htmlFor={`${question.question_key}-yes`} className="rating-option flex-row-reverse">
                      Si
                      <input  
                      type="radio"
                      className="size-4 accent-secondary" 
                      value={5}
                      checked={answers[question.question_key] === 5}
                      onChange={() => onAnswersChange(
                        {
                          ...answers,
                        [question.question_key]: 5
                      }
                      )}
                      id={`${question.question_key}-yes`} />
                    </label>
                    <label htmlFor={`${question.question_key}-no`} className="rating-option flex-row-reverse">
                      No
                      <input 
                      type="radio"
                      className="size-4 accent-secondary" 
                      value={1}
                      checked={answers[question.question_key] === 1}
                      onChange={() => onAnswersChange({
                        ...answers,
                        [question.question_key]: 1
                      })}
                      id={`${question.question_key}-no`} />
                    </label>
                   </div>
                 )
                        }
                      </fieldset>
                    ),
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <label className="mt-8 block font-secondary text-lg font-bold text-deepgreen">
        Comentarios adicionales

        <textarea
          name="comments"
          rows={6}
          value={comments}
          onChange={(event) => {
            onCommentsChange(
              event.target.value,
            );

            clearError();
          }}
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
            onClick={onCancel}
            disabled={saving}
            className="button-secondary"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() =>
              void submit()
            }
            disabled={
              saving ||
              monthlyQuestions.length === 0
            }
            className="button-primary"
          >
            {saving
              ? "Guardando…"
              : "Finalizar evaluación"}
          </button>
        </div>
      )}
    </div>
  );
}
