export function ColumnHeader({dateOrTimeText}: {dateOrTimeText: string}) {
  return (
    <div className="grid h-8 grid-cols-[120px_1fr_340px_80px] items-center border-b border-line-0 bg-bg-1 px-4 text-[11px] font-medium uppercase tracking-[0.6px] text-fg-3">
      <div className="flex items-center gap-[6px]">
        {dateOrTimeText}
      </div>
      <div>Title</div>
      <div>Address</div>
      <div className="text-right">Views</div>
    </div>
  );
}
