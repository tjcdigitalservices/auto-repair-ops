import { describe, expect, it } from "vitest";

import { shouldShowBranchSelector } from "@/lib/branch-selector-visibility";

describe("shouldShowBranchSelector", () => {
  it("hides the selector for single-branch tenants", () => {
    expect(
      shouldShowBranchSelector({
        branches: [{ id: "branch-1" }],
        canSwitch: true,
      }),
    ).toBe(false);
  });

  it("hides the selector when the user cannot switch branches", () => {
    expect(
      shouldShowBranchSelector({
        branches: [{ id: "branch-1" }, { id: "branch-2" }],
        canSwitch: false,
      }),
    ).toBe(false);
  });

  it("shows the selector for owners with multiple branches", () => {
    expect(
      shouldShowBranchSelector({
        branches: [{ id: "branch-1" }, { id: "branch-2" }],
        canSwitch: true,
      }),
    ).toBe(true);
  });
});
