import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChromeProvider } from "@/components/ChromeProvider";
import { createFakeChromeApi } from "@/lib/__tests__/test-chrome";
import { DayView } from "@/components/history/DayView";
import type { HistoryEntry } from "@/lib/types";

const e = (id: string, date: Date, title = id): HistoryEntry => ({
  id,
  url: `https://a.com/${id}`,
  title,
  host: "a.com",
  hostLetter: "A",
  hostColor: "oklch(0.7 0.1 200)",
  lastVisitTime: date,
  visitCount: 1,
  typedCount: 0,
  searchKey: `${title}\nhttps://a.com/${id}\na.com`.toLowerCase(),
});

const wrap = (ui: React.ReactNode) =>
  render(<ChromeProvider api={createFakeChromeApi()}>{ui}</ChromeProvider>);

describe("DayView", () => {
  const selectedDay = new Date(2026, 3, 14);

  it('renders the "no history on day" empty state when there are no entries', () => {
    wrap(
      <DayView
        entries={[]}
        loading={false}
        query=""
        selectedDay={selectedDay}
      />,
    );
    expect(
      screen.getByText(/No history on Tuesday, April 14, 2026/),
    ).toBeInTheDocument();
  });

  it('renders the "no matches" empty state when a query is active', () => {
    wrap(
      <DayView
        entries={[]}
        loading={false}
        query="xyz"
        selectedDay={selectedDay}
      />,
    );
    expect(screen.getByText(/No history matches "xyz"/)).toBeInTheDocument();
  });

  it("renders hour headers in descending order with correct totals", () => {
    const entries = [
      e("alpha", new Date(2026, 3, 14, 9, 30), "Alpha Page"),
      e("beta", new Date(2026, 3, 14, 14, 5), "Beta Page"),
      e("gamma", new Date(2026, 3, 14, 14, 50), "Gamma Page"),
    ];
    wrap(
      <DayView
        entries={entries}
        loading={false}
        query=""
        selectedDay={selectedDay}
      />,
    );
    const hours = screen.getAllByText(/^\d{2}:00$/).map((el) => el.textContent);
    expect(hours).toEqual(["14:00", "09:00"]);
    expect(screen.getByText("Alpha Page")).toBeInTheDocument();
    expect(screen.getByText("Beta Page")).toBeInTheDocument();
    expect(screen.getByText("Gamma Page")).toBeInTheDocument();
  });
});
