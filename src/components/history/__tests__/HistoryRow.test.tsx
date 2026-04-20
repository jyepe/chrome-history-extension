import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  searchKey:
    "anthropics/claude-sdk\nhttps://github.com/anthropics/claude-sdk\ngithub.com",
};

type TabsCreate = (q: { url: string; active: boolean }) => Promise<void>;

const renderRow = (e: HistoryEntry, tabsCreate?: TabsCreate) =>
  render(
    <ChromeProvider api={createFakeChromeApi({ tabsCreate })}>
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

  it("renders as a link with the entry URL", () => {
    renderRow(entry);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", entry.url);
  });

  it("left-click opens the URL in a new tab via chrome.tabs.create", async () => {
    const tabsCreate = vi.fn().mockResolvedValue(undefined);
    renderRow(entry, tabsCreate);
    await userEvent.click(screen.getByRole("link"));
    expect(tabsCreate).toHaveBeenCalledWith({ url: entry.url, active: true });
  });

  it("ctrl+click lets the browser handle navigation without calling tabs.create", () => {
    const tabsCreate = vi.fn().mockResolvedValue(undefined);
    renderRow(entry, tabsCreate);
    fireEvent.click(screen.getByRole("link"), { ctrlKey: true });
    expect(tabsCreate).not.toHaveBeenCalled();
  });

  it("meta+click lets the browser handle navigation without calling tabs.create", () => {
    const tabsCreate = vi.fn().mockResolvedValue(undefined);
    renderRow(entry, tabsCreate);
    fireEvent.click(screen.getByRole("link"), { metaKey: true });
    expect(tabsCreate).not.toHaveBeenCalled();
  });

  it("Enter key opens the URL in a new tab", async () => {
    const tabsCreate = vi.fn().mockResolvedValue(undefined);
    renderRow(entry, tabsCreate);
    screen.getByRole("link").focus();
    await userEvent.keyboard("{Enter}");
    expect(tabsCreate).toHaveBeenCalledWith({ url: entry.url, active: true });
  });

  it("Space key opens the URL in a new tab", async () => {
    const tabsCreate = vi.fn().mockResolvedValue(undefined);
    renderRow(entry, tabsCreate);
    screen.getByRole("link").focus();
    await userEvent.keyboard(" ");
    expect(tabsCreate).toHaveBeenCalledWith({ url: entry.url, active: true });
  });
});
