type SubmissionSuccessProps = {
  eyebrow: string;
  title: string;
  description: string;
  saveStatus: "synced" | "queued";
  queuedMessage: string;
  actionLabel: string;
  onAction: () => void;
};

export default function SubmissionSuccess({
  eyebrow,
  title,
  description,
  saveStatus,
  queuedMessage,
  actionLabel,
  onAction,
}: SubmissionSuccessProps) {
  return (
    <div className="mx-auto max-w-xl py-8 text-center" role="status">
      <p className="text-xs font-bold uppercase tracking-widest text-secondary">
        {eyebrow}
      </p>
      <h3 className="mt-2 text-2xl font-semibold text-deepgreen">{title}</h3>
      {saveStatus === "queued" && (
        <p className="mx-auto mt-2 max-w-xl rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
          {queuedMessage}
        </p>
      )}
      <p className="mt-3 text-sm text-slate-600">{description}</p>
      <button type="button" onClick={onAction} className="button-primary mt-5">
        {actionLabel}
      </button>
    </div>
  );
}
