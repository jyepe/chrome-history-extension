import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("renders a loading skeleton when loading and no entries", () => {
    wrap(<DayView entries={[]} loading query="" selectedDay={selectedDay} />);
    expect(screen.getByLabelText("Loading history")).toBeInTheDocument();
  });

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
    const hours = screen
      .getAllByText(/^\d{1,2}:00\s(AM|PM)$/)
      .map((el) => el.textContent);
    expect(hours).toEqual(["2:00 PM", "9:00 AM"]);
    expect(screen.getByText("Alpha Page")).toBeInTheDocument();
    expect(screen.getByText("Beta Page")).toBeInTheDocument();
    expect(screen.getByText("Gamma Page")).toBeInTheDocument();
  });
});

describe("DayView — collapse per hour", () => {
  const selectedDay = new Date(2026, 3, 14);
  const entries = [
    e("alpha", new Date(2026, 3, 14, 9, 30), "Alpha Page"),
    e("beta", new Date(2026, 3, 14, 14, 5), "Beta Page"),
    e("gamma", new Date(2026, 3, 14, 14, 50), "Gamma Page"),
  ];

  it("shows all rows initially", () => {
    wrap(
      <DayView
        entries={entries}
        loading={false}
        query=""
        selectedDay={selectedDay}
      />,
    );
    expect(screen.getByText("Alpha Page")).toBeInTheDocument();
    expect(screen.getByText("Beta Page")).toBeInTheDocument();
    expect(screen.getByText("Gamma Page")).toBeInTheDocument();
  });

  it("hides an hour's rows when its chevron is clicked", async () => {
    wrap(
      <DayView
        entries={entries}
        loading={false}
        query=""
        selectedDay={selectedDay}
      />,
    );
    // First chevron = 2 PM group (most recent, first in list)
    const buttons = screen.getAllByRole("button", { name: "Collapse hour" });
    await userEvent.click(buttons[0]);
    expect(screen.queryByText("Beta Page")).not.toBeInTheDocument();
    expect(screen.queryByText("Gamma Page")).not.toBeInTheDocument();
    expect(screen.getByText("Alpha Page")).toBeInTheDocument();
  });

  it("restores rows when chevron is clicked again", async () => {
    wrap(
      <DayView
        entries={entries}
        loading={false}
        query=""
        selectedDay={selectedDay}
      />,
    );
    const buttons = screen.getAllByRole("button", { name: "Collapse hour" });
    await userEvent.click(buttons[0]);
    const expandBtn = screen.getAllByRole("button", { name: "Expand hour" })[0];
    await userEvent.click(expandBtn);
    expect(screen.getByText("Beta Page")).toBeInTheDocument();
    expect(screen.getByText("Gamma Page")).toBeInTheDocument();
  });
});

describe("DayView — collapse all / expand all", () => {
  const selectedDay = new Date(2026, 3, 14);
  const entries = [
    e("alpha", new Date(2026, 3, 14, 9, 30), "Alpha Page"),
    e("beta", new Date(2026, 3, 14, 14, 5), "Beta Page"),
  ];

  it("renders a 'Collapse all' button", () => {
    wrap(
      <DayView
        entries={entries}
        loading={false}
        query=""
        selectedDay={selectedDay}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Collapse all" }),
    ).toBeInTheDocument();
  });

  it("hides all rows after clicking 'Collapse all'", async () => {
    wrap(
      <DayView
        entries={entries}
        loading={false}
        query=""
        selectedDay={selectedDay}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Collapse all" }));
    expect(screen.queryByText("Alpha Page")).not.toBeInTheDocument();
    expect(screen.queryByText("Beta Page")).not.toBeInTheDocument();
  });

  it("shows 'Expand all' after collapsing all", async () => {
    wrap(
      <DayView
        entries={entries}
        loading={false}
        query=""
        selectedDay={selectedDay}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Collapse all" }));
    expect(
      screen.getByRole("button", { name: "Expand all" }),
    ).toBeInTheDocument();
  });

  it("restores all rows after clicking 'Expand all'", async () => {
    wrap(
      <DayView
        entries={entries}
        loading={false}
        query=""
        selectedDay={selectedDay}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Collapse all" }));
    await userEvent.click(screen.getByRole("button", { name: "Expand all" }));
    expect(screen.getByText("Alpha Page")).toBeInTheDocument();
    expect(screen.getByText("Beta Page")).toBeInTheDocument();
  });
});
