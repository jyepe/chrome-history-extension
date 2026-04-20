export type EmptyStateVariant = "none" | "search" | "range";

export function EmptyState({
  variant,
  query,
  label,
}: {
  variant: EmptyStateVariant;
  query?: string;
  label?: string;
}) {
  const message =
    variant === "search" && query
      ? `No history matches "${query}"`
      : variant === "range" && label
        ? label
        : "No browsing history in the last 30 days";
  return (
    <div className="flex items-center justify-center p-12 text-[13px] text-fg-3">
      {message}
    </div>
  );
}
