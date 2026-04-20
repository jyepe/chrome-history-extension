import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChromeProvider } from "@/components/ChromeProvider";
import { createFakeChromeApi } from "@/lib/__tests__/test-chrome";
import { FavBadge } from "@/components/history/FavBadge";

const renderWith = (
  ui: React.ReactNode,
  extId: string | null = "test-ext-id",
) =>
  render(
    <ChromeProvider api={createFakeChromeApi({ extensionId: extId })}>
      {ui}
    </ChromeProvider>,
  );

describe("FavBadge", () => {
  it("renders the host letter fallback", () => {
    renderWith(
      <FavBadge
        host="github.com"
        letter="G"
        color="oklch(0.7 0.1 200)"
        pageUrl="https://github.com/"
      />,
    );
    expect(screen.getByText("G")).toBeInTheDocument();
  });

  it("renders a favicon img when extension id is available", () => {
    renderWith(
      <FavBadge
        host="github.com"
        letter="G"
        color="oklch(0.7 0.1 200)"
        pageUrl="https://github.com/"
      />,
    );
    const img = screen.getByRole("img", { hidden: true });
    expect(img).toHaveAttribute(
      "src",
      expect.stringContaining(
        "chrome-extension://test-ext-id/_favicon/?pageUrl=",
      ),
    );
  });

  it("omits the favicon img when extension id is null", () => {
    renderWith(
      <FavBadge
        host="github.com"
        letter="G"
        color="oklch(0.7 0.1 200)"
        pageUrl="https://github.com/"
      />,
      null,
    );
    expect(screen.queryByRole("img", { hidden: true })).toBeNull();
  });
});
