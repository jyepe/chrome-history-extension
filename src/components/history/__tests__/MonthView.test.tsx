import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChromeProvider } from "@/components/ChromeProvider";
import { createFakeChromeApi } from "@/lib/__tests__/test-chrome";
import { MonthView } from "@/components/history/MonthView";
import { dayKey } from "@/lib/date";
import type { HistoryEntry } from "@/lib/types";

const e = (
  id: string,
  date: Date,
  host = "a.com",
  views = 1,
  title = id,
): HistoryEntry => ({
  id,
  url: `https://${host}/${id}`,
  title,
  host,
  hostLetter: host[0].toUpperCase(),
  hostColor: "oklch(0.7 0.1 200)",
  lastVisitTime: date,
  visitCount: views,
  typedCount: 0,
  searchKey: `${title}\nhttps://${host}/${id}\n${host}`.toLowerCase(),
});

const wrap = (ui: React.ReactNode) =>
  render(<ChromeProvider api={createFakeChromeApi()}>{ui}</ChromeProvider>);

describe("MonthView", () => {
  const monthStart = new Date(2026, 3, 1); // April 2026
  const selectedDay = new Date(2026, 3, 14);

  it("renders a loading skeleton when loading and no entries", () => {
    wrap(
      <MonthView
        entries={[]}
        loading
        query=""
        monthStart={monthStart}
        selectedDay={selectedDay}
        onSelectDay={() => {}}
      />,
    );
    expect(screen.getByLabelText("Loading history")).toBeInTheDocument();
  });

  it('renders the "no history in month" empty state when there are no entries', () => {
    wrap(
      <MonthView
        entries={[]}
        loading={false}
        query=""
        monthStart={monthStart}
        selectedDay={selectedDay}
        onSelectDay={() => {}}
      />,
    );
    expect(screen.getByText(/No history in April 2026/)).toBeInTheDocument();
  });

  it('renders the "no matches" empty state when a query is active', () => {
    wrap(
      <MonthView
        entries={[]}
        loading={false}
        query="xyz"
        monthStart={monthStart}
        selectedDay={selectedDay}
        onSelectDay={() => {}}
      />,
    );
    expect(screen.getByText(/No history matches "xyz"/)).toBeInTheDocument();
  });

  it("renders 7 weekday headers and 42 date cells", () => {
    const entries = [e("a", new Date(2026, 3, 14, 9))];
    wrap(
      <MonthView
        entries={entries}
        loading={false}
        query=""
        monthStart={monthStart}
        selectedDay={selectedDay}
        onSelectDay={() => {}}
      />,
    );
    // Weekday headers
    for (const w of [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ]) {
      expect(screen.getByText(w)).toBeInTheDocument();
    }
    // 42 cells
    const cells = screen
      .getAllByRole("button")
      .filter((el) =>
        el.getAttribute("data-testid")?.startsWith("month-cell-"),
      );
    expect(cells).toHaveLength(42);
  });

  it("shows a views/pages pill and domain hints for a day with entries", () => {
    const entries = [
      e("a", new Date(2026, 3, 14, 9), "a.com", 3),
      e("b", new Date(2026, 3, 14, 10), "b.com", 4),
    ];
    wrap(
      <MonthView
        entries={entries}
        loading={false}
        query=""
        monthStart={monthStart}
        selectedDay={selectedDay}
        onSelectDay={() => {}}
      />,
    );
    const cell = screen.getByTestId(
      `month-cell-${dayKey(new Date(2026, 3, 14))}`,
    );
    expect(cell).toHaveTextContent("7"); // views total (3 + 4)
    expect(cell).toHaveTextContent("2"); // pages total
    expect(cell).toHaveTextContent("a.com");
    expect(cell).toHaveTextContent("b.com");
  });

  it("calls onSelectDay when an in-month cell is clicked", async () => {
    const onSelectDay = vi.fn();
    const entries = [e("a", new Date(2026, 3, 14, 9))];
    wrap(
      <MonthView
        entries={entries}
        loading={false}
        query=""
        monthStart={monthStart}
        selectedDay={selectedDay}
        onSelectDay={onSelectDay}
      />,
    );
    await userEvent.click(
      screen.getByTestId(`month-cell-${dayKey(new Date(2026, 3, 15))}`),
    );
    expect(onSelectDay).toHaveBeenCalledTimes(1);
    const received = onSelectDay.mock.calls[0][0] as Date;
    expect(received.getFullYear()).toBe(2026);
    expect(received.getMonth()).toBe(3);
    expect(received.getDate()).toBe(15);
  });

  it("does not call onSelectDay when an out-of-month cell is clicked", async () => {
    const onSelectDay = vi.fn();
    const entries = [e("a", new Date(2026, 3, 14, 9))];
    wrap(
      <MonthView
        entries={entries}
        loading={false}
        query=""
        monthStart={monthStart}
        selectedDay={selectedDay}
        onSelectDay={onSelectDay}
      />,
    );
    // March 29, 2026 — a gray-out cell in the April grid (Sunday before Apr 1)
    await userEvent.click(
      screen.getByTestId(`month-cell-${dayKey(new Date(2026, 2, 29))}`),
    );
    expect(onSelectDay).not.toHaveBeenCalled();
  });

  it("marks exactly one cell aria-pressed for the selected day", () => {
    const entries = [e("a", new Date(2026, 3, 14, 9))];
    wrap(
      <MonthView
        entries={entries}
        loading={false}
        query=""
        monthStart={monthStart}
        selectedDay={new Date(2026, 3, 14)}
        onSelectDay={() => {}}
      />,
    );
    const pressed = screen
      .getAllByRole("button")
      .filter((el) => el.getAttribute("aria-pressed") === "true");
    expect(pressed).toHaveLength(1);
    expect(pressed[0]).toHaveAttribute(
      "data-testid",
      `month-cell-${dayKey(new Date(2026, 3, 14))}`,
    );
  });
});
