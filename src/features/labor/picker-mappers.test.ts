import { describe, expect, it } from "vitest";

import {
  buildLaborPickerOptionId,
  dedupeLaborPickerOptions,
  filterLaborPickerOptions,
  mapLaborSourceRowToPickerOption,
} from "@/features/labor/picker-mappers";

describe("labor picker mappers", () => {
  it("builds stable ids from description and price", () => {
    const id = buildLaborPickerOptionId("Engine removal", 1500);

    expect(id).toBe(buildLaborPickerOptionId("Engine removal", 1500));
    expect(id.startsWith("labor-")).toBe(true);
  });

  it("maps source rows and filters by description", () => {
    const option = mapLaborSourceRowToPickerOption({
      description: " Panel beating ",
      unit_price: 800,
    });

    expect(option.label).toBe("Panel beating");
    expect(filterLaborPickerOptions([option], "panel")).toEqual([option]);
    expect(filterLaborPickerOptions([option], "paint")).toEqual([]);
  });

  it("dedupes labor options by description and price", () => {
    const first = mapLaborSourceRowToPickerOption({
      description: "Diagnostics",
      unit_price: 500,
    });
    const duplicate = mapLaborSourceRowToPickerOption({
      description: "Diagnostics",
      unit_price: 500,
    });
    const unique = mapLaborSourceRowToPickerOption({
      description: "Diagnostics",
      unit_price: 600,
    });

    expect(dedupeLaborPickerOptions([first, duplicate, unique])).toHaveLength(2);
  });
});
