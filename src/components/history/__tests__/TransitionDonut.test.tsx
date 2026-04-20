import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TransitionDonut } from "@/components/history/TransitionDonut";

describe("TransitionDonut", () => {
  it("renders each label + its count in the legend", () => {
    render(
      <TransitionDonut
        counts={{ typed: 3, link: 10, reload: 1, form: 2, total: 16 }}
      />,
    );
    expect(screen.getByText("Typed")).toBeInTheDocument();
    expect(screen.getByText("Link")).toBeInTheDocument();
    expect(screen.getByText("Reload")).toBeInTheDocument();
    expect(screen.getByText("Form")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders the total in the center", () => {
    render(
      <TransitionDonut
        counts={{ typed: 3, link: 10, reload: 1, form: 2, total: 16 }}
      />,
    );
    expect(screen.getByText("16")).toBeInTheDocument();
    expect(screen.getByText("TOTAL")).toBeInTheDocument();
  });

  it("renders a zero-state when total is 0", () => {
    render(
      <TransitionDonut
        counts={{ typed: 0, link: 0, reload: 0, form: 0, total: 0 }}
      />,
    );
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
