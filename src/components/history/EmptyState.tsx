export type EmptyStateVariant = "none" | "search";

export function EmptyState({
  variant,
  query,
}: {
  variant: EmptyStateVariant;
  query?: string;
}) {
  const message =
    variant === "search" && query
      ? `No history matches "${query}"`
      : "No browsing history in the last 30 days";
  return (
    <div className="flex items-center justify-center p-12 text-[13px] text-fg-3">
      {message}
    </div>
  );
}
