import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchInputProps {
  value: string;
  onChange: (next: string) => void;
  className?: string;
}

export function SearchInput({ value, onChange, className }: SearchInputProps) {
  return (
    <div className={cn("relative w-[220px] max-w-[32vw]", className)}>
      <Search
        aria-hidden
        size={14}
        className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-fg-3"
      />
      <input
        type="search"
        role="searchbox"
        placeholder="Search history"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-7 w-full rounded-lg border border-line-0 bg-bg-2 py-0 pl-7 pr-2 text-[13px] text-fg-0 outline-none transition-colors",
          "placeholder:text-fg-3 focus:border-amber focus:bg-bg-1",
        )}
      />
    </div>
  );
}
