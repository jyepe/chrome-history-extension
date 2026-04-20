import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ViewSegment } from "@/components/history/ViewSegment";
import { TooltipProvider } from "@/components/ui/tooltip";

const renderSeg = (
  value: "list" | "day" | "week" | "month",
  onChange = () => {},
) =>
  render(
    <TooltipProvider>
      <ViewSegment value={value} onChange={onChange} />
    </TooltipProvider>,
  );

describe("ViewSegment", () => {
  it("renders all four options", () => {
    renderSeg("list");
    expect(screen.getByRole("radio", { name: "List" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Day" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Week" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Month" })).toBeInTheDocument();
  });

  it("enables all four options", () => {
    renderSeg("list");
    expect(screen.getByRole("radio", { name: "List" })).not.toBeDisabled();
    expect(screen.getByRole("radio", { name: "Day" })).not.toBeDisabled();
    expect(screen.getByRole("radio", { name: "Week" })).not.toBeDisabled();
    expect(screen.getByRole("radio", { name: "Month" })).not.toBeDisabled();
  });

  it("fires onChange('day') when Day is clicked", async () => {
    const onChange = vi.fn();
    renderSeg("list", onChange);
    await userEvent.click(screen.getByRole("radio", { name: "Day" }));
    expect(onChange).toHaveBeenCalledWith("day");
  });

  it("fires onChange('week') when Week is clicked", async () => {
    const onChange = vi.fn();
    renderSeg("list", onChange);
    await userEvent.click(screen.getByRole("radio", { name: "Week" }));
    expect(onChange).toHaveBeenCalledWith("week");
  });

  it("fires onChange('month') when Month is clicked", async () => {
    const onChange = vi.fn();
    renderSeg("list", onChange);
    await userEvent.click(screen.getByRole("radio", { name: "Month" }));
    expect(onChange).toHaveBeenCalledWith("month");
  });
});
