import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChromeProvider } from "@/components/ChromeProvider";
import { createFakeChromeApi } from "@/lib/__tests__/test-chrome";
import { HistoryRow } from "@/components/history/HistoryRow";
import type { HistoryEntry } from "@/lib/types";

const entry: HistoryEntry = {
  id: "1",
  url: "https://github.com/anthropics/claude-sdk",
  title: "anthropics/claude-sdk",
  host: "github.com",
  hostLetter: "G",
  hostColor: "oklch(0.7 0.1 200)",
  lastVisitTime: new Date(2026, 3, 14, 9, 30, 5),
  visitCount: 2,
  typedCount: 0,
};

const renderRow = (e: HistoryEntry) =>
  render(
    <ChromeProvider api={createFakeChromeApi()}>
      <HistoryRow entry={e} />
    </ChromeProvider>,
  );

describe("HistoryRow", () => {
  it("renders time, title, url, and view count", () => {
    renderRow(entry);
    expect(screen.getByText("09:30:05")).toBeInTheDocument();
    expect(screen.getByText("anthropics/claude-sdk")).toBeInTheDocument();
    expect(screen.getByText(/github\.com/)).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it('applies the "hot" badge variant when visitCount >= 3', () => {
    const hot = { ...entry, visitCount: 4 };
    const { container } = renderRow(hot);
    const badge = container.querySelector('[data-hot="true"]');
    expect(badge).not.toBeNull();
  });

  it("applies the normal badge variant when visitCount < 3", () => {
    const { container } = renderRow(entry);
    const badge = container.querySelector('[data-hot="false"]');
    expect(badge).not.toBeNull();
  });
});
