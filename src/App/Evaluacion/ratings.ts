export type Rating = "needs_work" | "good" | "excellent";

export const ratingOptions: Array<{ value: Rating; label: string }> = [
  { value: "needs_work", label: "Siempre" },
  { value: "good", label: "A veces" },
  { value: "excellent", label: "Nunca" },
];
