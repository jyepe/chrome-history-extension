export function ListSkeleton() {
  return (
    <div className="space-y-px" aria-busy="true" aria-label="Loading history">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="grid h-[34px] animate-pulse grid-cols-[120px_1fr_340px_80px] items-center gap-4 px-4"
          style={{ opacity: 1 - i * 0.06 }}
        >
          <div className="h-3 w-16 rounded bg-bg-2" />
          <div className="h-3 w-48 rounded bg-bg-2" />
          <div className="h-3 w-64 rounded bg-bg-2" />
          <div className="ml-auto h-3 w-8 rounded bg-bg-2" />
        </div>
      ))}
    </div>
  )
}
