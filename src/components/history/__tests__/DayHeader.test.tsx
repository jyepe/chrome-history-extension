import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DayHeader } from "@/components/history/DayHeader";
import type { DayGroup } from "@/lib/types";

const group: DayGroup = {
  date: new Date(2026, 3, 14), // April 14, 2026
  entries: [],
  totalViews: 42,
};

describe("DayHeader", () => {
  it("renders the date and total views", () => {
    render(<DayHeader group={group} collapsed={false} onToggle={vi.fn()} />);
    expect(screen.getByText(/April 14, 2026/)).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("sets aria-expanded=true when expanded", () => {
    render(<DayHeader group={group} collapsed={false} onToggle={vi.fn()} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
  });

  it("sets aria-expanded=false when collapsed", () => {
    render(<DayHeader group={group} collapsed={true} onToggle={vi.fn()} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
  });

  it("calls onToggle when the chevron button is clicked", async () => {
    const onToggle = vi.fn();
    render(<DayHeader group={group} collapsed={false} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledOnce();
  });
});
