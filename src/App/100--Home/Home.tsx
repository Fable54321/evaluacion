import { useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { Link } from "react-router-dom";
import vegibecLogo from "../../assets/vegibec.png";
import { useEvaluation } from "../../Contexts/evaluationContext";
import {
  PrintableMonthlyEvaluation,
  PrintablePerformanceAlert,
} from "../Evaluacion/PrintableEvaluations";
import { useAuth } from "../../Contexts/AuthContext";

type PrintType = "monthly" | "performance" | null;

function PrinterIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6z" />
    </svg>
  );
}

const Home = () => {
  const { monthlyQuestions, fetchMonthlyQuestions } = useEvaluation();
  const { user } = useAuth();
  const [printType, setPrintType] = useState<PrintType>(null);

  const canPrint = useMemo(
    () =>
      user?.appAccess.find((app) => app.slug === "evaluacion")?.role ===
      "admin",
    [user],
  );

  useEffect(() => {
    if (canPrint && monthlyQuestions.length === 0) void fetchMonthlyQuestions();
  }, [canPrint, fetchMonthlyQuestions, monthlyQuestions.length]);

  useEffect(() => {
    const clearPrintedEvaluation = () => setPrintType(null);
    window.addEventListener("afterprint", clearPrintedEvaluation);
    return () => window.removeEventListener("afterprint", clearPrintedEvaluation);
  }, []);

  const printEvaluation = (type: Exclude<PrintType, null>) => {
    flushSync(() => setPrintType(type));
    window.print();
  };

  const evaluationLinkClass = `flex min-h-16 flex-1 items-center px-5 py-3 text-lg font-bold tracking-tight text-white transition hover:bg-primary md:text-xl ${
    canPrint ? "justify-start text-left" : "justify-center text-center"
  }`;

  return (
    <main className={`home-page min-h-screen px-4 py-10 font-primary ${printType ? "print-ready" : ""}`}>
      <article className="home-content mx-auto flex max-w-3xl flex-col items-center gap-8 md:gap-12">
        <div className="w-[min(98%,700px)]">
          <img src={vegibecLogo} alt="Vegibec" />
        </div>

        <section className="w-full max-w-xl flex flex-col items-center" aria-labelledby="evaluation-type-heading">
          <h1 id="evaluation-type-heading" className="mb-4 text-center font-secondary text-xl font-semibold text-deepgreen md:text-2xl">
            Seleccione el tipo de evaluación
          </h1>
          <div className="grid gap-3 w-[min(100%,450px)]">
            <div className="flex overflow-hidden rounded-xl bg-secondary shadow-sm">
              <Link
                to="evaluaciones-mensuales"
                className={evaluationLinkClass}
              >
                Evaluaciones mensuales
              </Link>
             {canPrint && <button
                type="button"
                onClick={() => printEvaluation("monthly")}
                disabled={monthlyQuestions.length === 0}
                className="flex w-16 shrink-0 items-center justify-center border-l border-white/40 bg-white text-secondary transition hover:bg-tertiary disabled:cursor-wait disabled:opacity-60"
                aria-label="Imprimir evaluación mensual en blanco"
                title={monthlyQuestions.length === 0 ? "Preparando preguntas…" : "Imprimir evaluación mensual"}
              >
                <PrinterIcon />
              </button>}
            </div>

            <div className="flex overflow-hidden rounded-xl bg-secondary shadow-sm">
              <Link
                to="variacion-de-desempeno"
                className={evaluationLinkClass}
              >
                Alertas de desempeño
              </Link>
              { canPrint && <button
                type="button"
                onClick={() => printEvaluation("performance")}
                className="flex w-16 shrink-0 items-center justify-center border-l border-white/40 bg-white text-secondary transition hover:bg-tertiary"
                aria-label="Imprimir alerta de desempeño en blanco"
                title="Imprimir alerta de desempeño"
              >
                <PrinterIcon />
              </button>}
            </div>
          </div>
          {canPrint && monthlyQuestions.length === 0 && (
            <p className="mt-3 text-center text-xs font-semibold text-slate-600" aria-live="polite">
              Preparando la versión imprimible de la evaluación mensual…
            </p>
          )}
        </section>
      </article>

      {printType === "monthly" && <PrintableMonthlyEvaluation questions={monthlyQuestions} />}
      {printType === "performance" && <PrintablePerformanceAlert />}
    </main>
  );
};

export default Home;
