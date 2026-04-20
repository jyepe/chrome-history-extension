import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChromeProvider } from "@/components/ChromeProvider";
import { createFakeChromeApi } from "@/lib/__tests__/test-chrome";
import { MonthEntriesPanel } from "@/components/history/MonthEntriesPanel";
import type { HistoryEntry } from "@/lib/types";

const e = (
  id: string,
  date: Date,
  title = id,
  url = `https://a.com/${id}`,
): HistoryEntry => ({
  id,
  url,
  title,
  host: "a.com",
  hostLetter: "A",
  hostColor: "oklch(0.7 0.1 200)",
  lastVisitTime: date,
  visitCount: 1,
  typedCount: 0,
  searchKey: `${title}\n${url}\na.com`.toLowerCase(),
});

const wrapWith = (ui: React.ReactNode, api = createFakeChromeApi()) =>
  render(<ChromeProvider api={api}>{ui}</ChromeProvider>);

describe("MonthEntriesPanel", () => {
  it("renders the day label and the entry count", () => {
    const entries = [e("a", new Date(2026, 3, 14, 9), "Alpha")];
    wrapWith(
      <MonthEntriesPanel
        dayLabel="Tuesday, April 14, 2026"
        entries={entries}
      />,
    );
    expect(screen.getByTestId("month-entries-day-label")).toHaveTextContent(
      "Tuesday, April 14, 2026",
    );
    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading).toHaveTextContent(/Visited Sites\s*1/);
  });

  it("renders one row per entry sorted by time descending", () => {
    const entries = [
      e("early", new Date(2026, 3, 14, 9), "Early"),
      e("late", new Date(2026, 3, 14, 17), "Late"),
      e("mid", new Date(2026, 3, 14, 12), "Mid"),
    ];
    wrapWith(
      <MonthEntriesPanel
        dayLabel="Tuesday, April 14, 2026"
        entries={entries}
      />,
    );
    const anchors = screen.getAllByRole("link");
    expect(anchors).toHaveLength(3);
    expect(anchors[0]).toHaveTextContent("Late");
    expect(anchors[1]).toHaveTextContent("Mid");
    expect(anchors[2]).toHaveTextContent("Early");
  });

  it("shows the empty state when entries is empty", () => {
    wrapWith(
      <MonthEntriesPanel dayLabel="Tuesday, April 14, 2026" entries={[]} />,
    );
    expect(
      screen.getByText(/No sites visited on this day/),
    ).toBeInTheDocument();
  });

  it("left-clicking a row opens it via tabs.create", async () => {
    const tabsCreate = vi.fn().mockResolvedValue(undefined);
    const entries = [e("a", new Date(2026, 3, 14, 9), "Alpha")];
    wrapWith(
      <MonthEntriesPanel dayLabel="Tuesday" entries={entries} />,
      createFakeChromeApi({ tabsCreate }),
    );
    await userEvent.click(screen.getByText("Alpha"));
    expect(tabsCreate).toHaveBeenCalledWith({
      url: "https://a.com/a",
      active: true,
    });
  });

  it("ctrl-clicking a row does not call tabs.create", async () => {
    const tabsCreate = vi.fn().mockResolvedValue(undefined);
    const entries = [e("a", new Date(2026, 3, 14, 9), "Alpha")];
    wrapWith(
      <MonthEntriesPanel dayLabel="Tuesday" entries={entries} />,
      createFakeChromeApi({ tabsCreate }),
    );
    const user = userEvent.setup();
    await user.keyboard("{Control>}");
    await user.click(screen.getByText("Alpha"));
    await user.keyboard("{/Control}");
    expect(tabsCreate).not.toHaveBeenCalled();
  });
});
