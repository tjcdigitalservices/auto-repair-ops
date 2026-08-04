import { describe, expect, it } from "vitest";

import {
  appendBranchContext,
  shouldShowBranchContext,
  shouldShowBranchSelector,
} from "@/lib/branch-selector-visibility";

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

describe("shouldShowBranchContext", () => {
  it("matches branch selector visibility", () => {
    expect(
      shouldShowBranchContext({
        branches: [{ id: "branch-1" }],
        canSwitch: true,
      }),
    ).toBe(false);
  });
});

describe("appendBranchContext", () => {
  it("leaves copy unchanged when branch context is hidden", () => {
    expect(
      appendBranchContext("Compose and print A4 documents", "Main Branch", false),
    ).toBe("Compose and print A4 documents");
  });

  it("appends branch name when branch context is visible", () => {
    expect(
      appendBranchContext("Compose and print A4 documents", "North Branch", true),
    ).toBe("Compose and print A4 documents for North Branch.");
  });
});
