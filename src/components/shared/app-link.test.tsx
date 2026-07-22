import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppLink } from "@/components/shared/app-link";

describe("AppLink", () => {
  it("renders a navigational link", () => {
    render(<AppLink href="/settings">Settings</AppLink>);

    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "/settings",
    );
  });
});
