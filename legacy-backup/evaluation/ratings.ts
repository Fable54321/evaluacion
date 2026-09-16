export type Rating = "needs_work" | "good" | "excellent";

export const ratingOptions: Array<{ value: Rating; label: string }> = [
  { value: "needs_work", label: "Necesita mejorar" },
  { value: "good", label: "Bueno" },
  { value: "excellent", label: "Excelente" },
];
