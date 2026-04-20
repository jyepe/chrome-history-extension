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

  it("disables Day/Week/Month options", () => {
    renderSeg("list");
    expect(screen.getByRole("radio", { name: "Day" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Week" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Month" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "List" })).not.toBeDisabled();
  });

  it("does not fire onChange when a disabled option is clicked", async () => {
    const onChange = vi.fn();
    renderSeg("list", onChange);
    await userEvent.click(screen.getByRole("radio", { name: "Week" }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
