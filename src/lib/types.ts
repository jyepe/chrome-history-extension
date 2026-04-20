export type TransitionBucket = "typed" | "link" | "reload" | "form";

export interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  host: string;
  hostLetter: string;
  hostColor: string;
  lastVisitTime: Date;
  visitCount: number;
  typedCount: number;
  /** Lowercase `${title}\n${url}\n${host}` — precomputed so search doesn't re-lowercase per keystroke. */
  searchKey: string;
}

export interface DayGroup {
  date: Date;
  entries: HistoryEntry[];
  totalViews: number;
}

export interface HourGroup {
  hour: number;
  date: Date;
  entries: HistoryEntry[];
  totalViews: number;
}

export interface ActivityBucket {
  date: Date;
  label: string;
  pages: number;
  views: number;
}

export interface TransitionCounts {
  typed: number;
  link: number;
  reload: number;
  form: number;
  total: number;
}

export interface TopDomain {
  host: string;
  letter: string;
  color: string;
  count: number;
}
