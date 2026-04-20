import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChromeProvider } from "@/components/ChromeProvider";
import { createFakeChromeApi } from "@/lib/__tests__/test-chrome";
import { HistoryList } from "@/components/history/HistoryList";
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

describe("HistoryList", () => {
  it("renders a loading skeleton when loading and no entries", () => {
    wrap(<HistoryList entries={[]} loading query="" />);
    expect(screen.getByLabelText("Loading history")).toBeInTheDocument();
  });

  it('renders the "no history" empty state', () => {
    wrap(<HistoryList entries={[]} loading={false} query="" />);
    expect(screen.getByText(/No browsing history/)).toBeInTheDocument();
  });

  it('renders the "no matches" empty state', () => {
    wrap(<HistoryList entries={[]} loading={false} query="xyz" />);
    expect(screen.getByText(/No history matches "xyz"/)).toBeInTheDocument();
  });

  it("groups entries by day, descending", () => {
    const items = [
      e("a", new Date(2026, 3, 14, 10)),
      e("b", new Date(2026, 3, 14, 9)),
      e("c", new Date(2026, 3, 13, 15)),
    ];
    wrap(<HistoryList entries={items} loading={false} query="" />);
    const headers = screen.getAllByText(/April 1[34], 2026/);
    expect(headers).toHaveLength(2);
    expect(headers[0].textContent).toMatch(/April 14, 2026/);
    expect(headers[1].textContent).toMatch(/April 13, 2026/);
  });
});

describe("HistoryList — collapse per day", () => {
  const monday = new Date(2026, 3, 14, 10); // April 14, 2026
  const sunday = new Date(2026, 3, 13, 15); // April 13, 2026

  const entries = [
    e("alpha", monday, "Alpha Page"),
    e("beta", monday, "Beta Page"),
    e("gamma", sunday, "Gamma Page"),
  ];

  it("shows all rows initially", () => {
    wrap(<HistoryList entries={entries} loading={false} query="" />);
    expect(screen.getByText("Alpha Page")).toBeInTheDocument();
    expect(screen.getByText("Beta Page")).toBeInTheDocument();
    expect(screen.getByText("Gamma Page")).toBeInTheDocument();
  });

  it("hides a day's rows when its chevron is clicked", async () => {
    wrap(<HistoryList entries={entries} loading={false} query="" />);
    // First chevron = Monday (most recent day, first in list)
    const buttons = screen.getAllByRole("button", { name: "Collapse group" });
    await userEvent.click(buttons[0]);
    expect(screen.queryByText("Alpha Page")).not.toBeInTheDocument();
    expect(screen.queryByText("Beta Page")).not.toBeInTheDocument();
    expect(screen.getByText("Gamma Page")).toBeInTheDocument();
  });

  it("restores rows when chevron is clicked again", async () => {
    wrap(<HistoryList entries={entries} loading={false} query="" />);
    const buttons = screen.getAllByRole("button", { name: "Collapse group" });
    await userEvent.click(buttons[0]);
    // After collapse, button label changes to "Expand group"
    const expandBtn = screen.getAllByRole("button", { name: "Expand group" })[0];
    await userEvent.click(expandBtn);
    expect(screen.getByText("Alpha Page")).toBeInTheDocument();
    expect(screen.getByText("Beta Page")).toBeInTheDocument();
  });
});
