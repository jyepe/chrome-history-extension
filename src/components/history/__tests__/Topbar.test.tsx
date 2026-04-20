import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Topbar, type TopbarProps } from "@/components/history/Topbar";

const renderBar = (overrides: Partial<TopbarProps> = {}) => {
  const props: TopbarProps = {
    query: "",
    onQueryChange: () => {},
    view: "list",
    onViewChange: () => {},
    rangeLabel: "4/1/2026 – 4/14/2026",
    ...overrides,
  };
  return render(
    <TooltipProvider>
      <Topbar {...props} />
    </TooltipProvider>,
  );
};

describe("Topbar — navigation props", () => {
  it("disables Prev/Next/Today when handlers are not supplied (list view)", () => {
    renderBar();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Today/ })).toBeDisabled();
  });

  it("fires onPrev and onNext when chevrons are clicked", async () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    renderBar({ onPrev, onNext, onToday: () => {} });
    await userEvent.click(screen.getByRole("button", { name: "Previous" }));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onPrev).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("disables Next when canGoNext is false", () => {
    renderBar({
      onPrev: () => {},
      onNext: () => {},
      onToday: () => {},
      canGoNext: false,
    });
    expect(screen.getByRole("button", { name: "Previous" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("fires onToday when the Today chip is clicked", async () => {
    const onToday = vi.fn();
    renderBar({ onToday });
    await userEvent.click(screen.getByRole("button", { name: /Today/ }));
    expect(onToday).toHaveBeenCalledTimes(1);
  });

  it("renders the rangeLabel", () => {
    renderBar({ rangeLabel: "Tuesday, April 14, 2026" });
    expect(screen.getByText("Tuesday, April 14, 2026")).toBeInTheDocument();
  });
});
