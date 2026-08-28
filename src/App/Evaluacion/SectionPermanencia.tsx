import type { FormEvent } from "react";

export type PermanenceData = { recommendNextSeason: "yes" | "no" | ""; explanation: string };
// eslint-disable-next-line react-refresh/only-export-components
export const emptyPermanenceData: PermanenceData = { recommendNextSeason: "", explanation: "" };

type Props = { data: PermanenceData; onChange: (data: PermanenceData) => void; onBack: () => void; onSubmit: () => void | Promise<void>; saving: boolean; error: string };

export default function SectionPermanencia({ data, onChange, onBack, onSubmit, saving, error }: Props) {
  return <form onSubmit={(event: FormEvent) => { event.preventDefault(); void onSubmit(); }} className="space-y-6">
    <header className="rounded-lg border-l-4 border-primary bg-tertiary p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-secondary">Sección C</p>
      <h3 className="mt-1 font-secondary text-lg font-bold text-deepgreen">Evaluación de permanencia</h3>
    </header>
    <fieldset className="rounded-xl border border-slate-200 p-4">
      <legend className="px-1 font-semibold text-slate-900">¿Recomiendas a este empleado para la próxima temporada?</legend>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">{([{ value: "yes", label: "Sí" }, { value: "no", label: "No" }] as const).map((option) => (
        <label key={option.value} className={`rating-option ${data.recommendNextSeason === option.value ? "rating-option-selected" : ""}`}>
          <input type="radio" name="recommendNextSeason" value={option.value} checked={data.recommendNextSeason === option.value} onChange={() => onChange({ ...data, recommendNextSeason: option.value })} required className="size-4 accent-secondary" />{option.label}
        </label>
      ))}</div>
    </fieldset>
    <label className="block font-secondary text-lg font-bold text-deepgreen">Explica por qué
      <textarea name="permanenceExplanation" rows={5} value={data.explanation} onChange={(event) => onChange({ ...data, explanation: event.target.value })} required maxLength={2000} placeholder="Explica los motivos de tu recomendación." className="mt-2 block w-full resize-y rounded-lg border-2 border-gray-300 bg-white px-3 py-2.5 font-primary text-sm font-normal text-gray-900 outline-none transition focus:border-secondary focus:ring-2 focus:ring-primary/30" />
    </label>
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
    <div className="flex items-center justify-between gap-3"><button type="button" onClick={onBack} disabled={saving} className="button-secondary">Anterior</button><button type="submit" disabled={saving} className="button-primary">{saving ? "Guardando…" : "Finalizar evaluación"}</button></div>
  </form>;
}
