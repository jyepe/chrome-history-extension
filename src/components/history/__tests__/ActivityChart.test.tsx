import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ActivityChart } from "@/components/history/ActivityChart";
import type { ActivityBucket } from "@/lib/types";

const bucket = (
  label: string,
  views: number,
  pages: number,
): ActivityBucket => ({
  date: new Date(2026, 3, 14),
  label,
  views,
  pages,
});

describe("ActivityChart", () => {
  it("shows the total views and pages in the legend", () => {
    const buckets = [bucket("Apr 13", 5, 2), bucket("Apr 14", 10, 3)];
    render(<ActivityChart buckets={buckets} />);
    expect(screen.getByText(/Page Views:/)).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument(); // total views
    expect(screen.getByText(/Pages:/)).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument(); // total pages
  });
});
