import { describe, expect, it } from "vitest";

import { listInsertMenuItems } from "@/components/document-engine/insert/registry";

describe("insert menu registry", () => {
  it("registers block, variable, divider, image, and signature insert actions", () => {
    const topLevelIds = listInsertMenuItems().map((item) => item.id);

    expect(topLevelIds).toEqual(["blocks", "variables", "divider", "image-placeholder", "signature"]);
  });

  it("groups variables by category for nested insertion", () => {
    const variableGroup = listInsertMenuItems().find((item) => item.id === "variables");

    expect(variableGroup?.type).toBe("group");
    if (variableGroup?.type !== "group") {
      return;
    }

    expect(variableGroup.items.map((item) => item.label)).toEqual(["Customer", "Vehicle", "Company"]);
  });
});
