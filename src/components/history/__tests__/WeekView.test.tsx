import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChromeProvider } from "@/components/ChromeProvider";
import { createFakeChromeApi } from "@/lib/__tests__/test-chrome";
import { WeekView } from "@/components/history/WeekView";
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

describe("WeekView", () => {
  const weekStart = new Date(2026, 3, 12); // Sunday, Apr 12, 2026

  it("renders a loading skeleton when loading and no entries", () => {
    wrap(
      <WeekView
        entries={[]}
        loading
        query=""
        weekStart={weekStart}
      />,
    );
    expect(screen.getByLabelText("Loading history")).toBeInTheDocument();
  });

  it('renders the "no history in range" empty state when there are no entries', () => {
    wrap(
      <WeekView
        entries={[]}
        loading={false}
        query=""
        weekStart={weekStart}
      />,
    );
    expect(
      screen.getByText(/No history from 4\/12\/2026 to 4\/18\/2026/),
    ).toBeInTheDocument();
  });

  it('renders the "no matches" empty state when a query is active', () => {
    wrap(
      <WeekView
        entries={[]}
        loading={false}
        query="xyz"
        weekStart={weekStart}
      />,
    );
    expect(screen.getByText(/No history matches "xyz"/)).toBeInTheDocument();
  });

  it("renders 7 weekday column headers Sun..Sat", () => {
    const entries = [e("alpha", new Date(2026, 3, 14, 9), "Alpha")];
    wrap(
      <WeekView
        entries={entries}
        loading={false}
        query=""
        weekStart={weekStart}
      />,
    );
    expect(screen.getByText("Sun")).toBeInTheDocument();
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Tue")).toBeInTheDocument();
    expect(screen.getByText("Wed")).toBeInTheDocument();
    expect(screen.getByText("Thu")).toBeInTheDocument();
    expect(screen.getByText("Fri")).toBeInTheDocument();
    expect(screen.getByText("Sat")).toBeInTheDocument();
  });

  it("places entries under the correct weekday column", () => {
    const entries = [
      e("tue-a", new Date(2026, 3, 14, 9), "Tuesday Page"),
      e("thu-a", new Date(2026, 3, 16, 10), "Thursday Page"),
    ];
    wrap(
      <WeekView
        entries={entries}
        loading={false}
        query=""
        weekStart={weekStart}
      />,
    );
    const tueCol = screen.getByTestId("week-col-2");
    const thuCol = screen.getByTestId("week-col-4");
    const monCol = screen.getByTestId("week-col-1");
    expect(tueCol).toContainElement(screen.getByText("Tuesday Page"));
    expect(thuCol).toContainElement(screen.getByText("Thursday Page"));
    expect(monCol.textContent).not.toMatch(/Tuesday Page|Thursday Page/);
  });
});
