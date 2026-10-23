import type { MonthlyEvaluationQuestion } from "../../Contexts/evaluationContext";

type MonthlyPrintProps = {
  questions: MonthlyEvaluationQuestion[];
};

const monthlyGroups = [
  { id: "alignment", title: "Categoría 1 — Actitud" },
  { id: "learning", title: "Categoría 2 — Aprendizaje" },
  { id: "performance", title: "Categoría 3 — Responsabilidad" },
  { id: "negative", title: "Conductas negativas" },
  { id: "progress", title: "Categoría 4 — Progreso" },
] as const;

function BlankLine({ label }: { label: string }) {
  return (
    <div className="paper-field">
      <span>{label}</span>
      <span className="paper-field-line" />
    </div>
  );
}

function Checkbox({ label }: { label: string }) {
  return (
    <span className="paper-checkbox-option">
      <span className="paper-checkbox" aria-hidden="true" />
      {label}
    </span>
  );
}

function PaperHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="paper-header">
      <div>
        <p className="paper-kicker">Végibec</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <BlankLine label="Fecha" />
    </header>
  );
}

export function PrintableMonthlyEvaluation({ questions }: MonthlyPrintProps) {
  return (
    <article className="print-evaluation paper-form" aria-label="Versión imprimible de la evaluación mensual">
      <PaperHeader title="Evaluación mensual" subtitle="Empleados con 1–2 temporadas" />

      <section className="paper-identity-grid" aria-label="Identificación">
        <BlankLine label="Nombre del evaluador / jefe de equipo" />
        <BlankLine label="Matrícula" />
        <BlankLine label="Nombre de la persona evaluada" />
        <BlankLine label="Matrícula" />
      </section>

      <p className="paper-instructions">
        Marque la frecuencia con la que observa cada conducta: <strong>1 Nunca</strong>,{" "}
        <strong>2 Rara vez</strong>, <strong>3 A veces</strong>,{" "}
        <strong>4 Casi siempre</strong>, <strong>5 Siempre</strong>.
      </p>

      {monthlyGroups.map((group) => {
        const groupQuestions = questions.filter((question) => question.category === group.id);
        if (groupQuestions.length === 0) return null;

        return (
          <section key={group.id} className="paper-question-group">
            <h2>{group.title}</h2>
            <table className="paper-question-table">
              <thead>
                <tr>
                  <th scope="col">Conducta observada</th>
                  <th scope="col" className="paper-choice-heading">Respuesta</th>
                </tr>
              </thead>
              <tbody>
                {groupQuestions.map((question) => (
                  <tr key={question.question_key}>
                    <td>
                      <strong>{question.question_number}.</strong> {question.question_text}
                    </td>
                    <td>
                      <div className="paper-choice-row">
                        {(question.is_yes_or_no ? ["Sí", "No"] : ["1", "2", "3", "4", "5"]).map((choice) => (
                          <Checkbox key={choice} label={choice} />
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}

      <section className="paper-notes">
        <h2>Comentarios adicionales</h2>
        <div className="paper-writing-lines" aria-hidden="true" />
      </section>
    </article>
  );
}

export function PrintablePerformanceAlert() {
  return (
    <article className="print-evaluation paper-form" aria-label="Versión imprimible de la alerta de desempeño">
      <PaperHeader
        title="Alerta de desempeño"
        subtitle="Formulario para reportar cambios en el desempeño o la actitud de un empleado"
      />

      <section className="paper-section">
        <h2><span>1</span> Jefe de equipo y empleado</h2>
        <div className="paper-identity-grid">
          <BlankLine label="Nombre del jefe de equipo" />
          <BlankLine label="Matrícula" />
          <BlankLine label="Nombre del empleado" />
          <BlankLine label="Matrícula" />
        </div>
      </section>

      <section className="paper-section">
        <h2><span>2</span> Tipo de alerta</h2>
        <div className="paper-options paper-options-three">
          <Checkbox label="Actitud preocupante" />
          <Checkbox label="Observo cambios" />
          <Checkbox label="Excelente empleado" />
        </div>
      </section>

      <section className="paper-section">
        <h2><span>3</span> ¿Qué está pasando?</h2>
        <p className="paper-prompt">Describa la situación.</p>
        <div className="paper-writing-lines paper-writing-lines-tall" aria-hidden="true" />
      </section>

      <section className="paper-section">
        <h2><span>4</span> ¿Desde cuándo?</h2>
        <div className="paper-options">
          <Checkbox label="Hoy" />
          <Checkbox label="Esta semana" />
          <Checkbox label="Desde su llegada" />
          <Checkbox label="Otro" />
        </div>
        <BlankLine label="Si eligió “Otro”, especifique" />
      </section>

      <section className="paper-section">
        <h2><span>5</span> ¿Qué intentaste como jefe?</h2>
        <div className="paper-options">
          <Checkbox label="Ya hablé con él varias veces" />
          <Checkbox label="Lo estoy observando" />
          <Checkbox label="Otro" />
        </div>
        <p className="paper-prompt">Si eligió “Otro”, describa qué más intentó.</p>
        <div className="paper-writing-lines" aria-hidden="true" />
      </section>
    </article>
  );
}
