import { useState } from "react";

export type Rating = "needs_work" | "good" | "excellent";
export type SectionARatings = Partial<Record<(typeof sectionACriteria)[number]["id"], Rating>>;

// eslint-disable-next-line react-refresh/only-export-components
export const ratingOptions: Array<{ value: Rating; label: string }> = [
  { value: "needs_work", label: "Necesita mejorar" },
  { value: "good", label: "Bueno" },
  { value: "excellent", label: "Excelente" },
];

// eslint-disable-next-line react-refresh/only-export-components
export const sectionACriteria = [
  { id: "puntualidad", title: "Puntualidad", description: "El empleado llega a tiempo al empezar y terminar el trabajo, y respeta los tiempos de pausa y almuerzo." },
  { id: "competencias_tecnicas", title: "Competencias técnicas", description: "El empleado utiliza técnicas y material adecuados para el tipo de trabajo y logra los resultados esperados." },
  { id: "coherencia", title: "Coherencia", description: "El empleado proporciona un trabajo de calidad continuo o mejorado a través del tiempo." },
  { id: "adaptabilidad", title: "Adaptabilidad", description: "El empleado se adapta a nuevos desafíos, cambios de tarea y pedidos específicos con una actitud flexible." },
  { id: "asistencia", title: "Asistencia", description: "El empleado está disponible ante los cambios y ofrece ayuda a compañeros o supervisores cuando es necesario." },
  { id: "comunicacion", title: "Comunicación", description: "El empleado comunica necesidades, pedidos, logros y faltas de manera clara y respetuosa, favoreciendo la colaboración." },
  { id: "cooperacion_equipo", title: "Cooperación en equipo", description: "El empleado ayuda a mantener o superar los objetivos diarios de su equipo y apoya a compañeros con dificultades." },
  { id: "productividad_calidad", title: "Productividad y calidad del trabajo", description: "El empleado completa los objetivos diarios de acuerdo con los estándares de calidad de la empresa." },
  { id: "responsabilidad", title: "Responsabilidad", description: "El empleado asume las consecuencias de sus logros y faltas, y recibe las críticas constructivas adecuadamente." },
] as const;

type Props = { ratings: SectionARatings; onChange: (ratings: SectionARatings) => void; onBack: () => void; onNext: () => void };

export default function SectionA({ ratings, onChange, onBack, onNext }: Props) {
  const [warning, setWarning] = useState("");
  const continueToNextSection = () => {
    if (!sectionACriteria.every((criterion) => Boolean(ratings[criterion.id]))) {
      setWarning("Debe completar todos los criterios de la Sección A antes de continuar.");
      return;
    }
    setWarning("");
    onNext();
  };

  return <>
    <div className="border-b border-primary/30 pb-3"><p className="text-xs font-bold uppercase tracking-widest text-secondary">Sección A</p><h4 className="mt-1 text-xl font-semibold text-slate-950">Criterios de evaluación</h4><p className="mt-1 text-sm text-slate-600">Seleccione una valoración para cada criterio.</p></div>
    <div className="mt-4 space-y-4">{sectionACriteria.map((criterion, index) => <fieldset key={criterion.id} className="rounded-xl border border-slate-200 p-4"><legend className="px-1 font-semibold text-secondary">{index + 1}. {criterion.title}</legend><p className="mt-1 text-sm leading-6 text-slate-700">{criterion.description}</p><div className="mt-3 grid gap-2 sm:grid-cols-3">{ratingOptions.map((option) => { const selected = ratings[criterion.id] === option.value; return <label key={option.value} className={`rating-option ${selected ? "rating-option-selected" : ""}`}><input type="radio" name={`section-a-${criterion.id}`} checked={selected} onChange={() => { const next = { ...ratings, [criterion.id]: option.value }; onChange(next); if (sectionACriteria.every((entry) => Boolean(next[entry.id]))) setWarning(""); }} className="size-4 accent-secondary" />{option.label}</label>; })}</div></fieldset>)}</div>
    {warning && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{warning}</p>}
    <div className="mt-5 flex items-center justify-between gap-3"><button type="button" onClick={onBack} className="button-secondary">Anterior</button><button type="button" onClick={continueToNextSection} className="button-primary">Siguiente</button></div>
  </>;
}
