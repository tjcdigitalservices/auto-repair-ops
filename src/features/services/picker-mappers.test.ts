import { describe, expect, it } from "vitest";

import {
  filterServicePickerOptions,
  mapInlineCreateResultToServicePickerOption,
} from "@/features/services/picker-mappers";

describe("service picker mappers", () => {
  it("maps inline create results", () => {
    expect(
      mapInlineCreateResultToServicePickerOption({
        id: "service-1",
        label: "Oil change",
        category: "Maintenance",
        unitPrice: 450,
      }),
    ).toEqual({
      id: "service-1",
      label: "Oil change",
      category: "Maintenance",
      unitPrice: 450,
    });
  });

  it("filters services by label and category", () => {
    const services = [
      {
        id: "service-1",
        label: "Oil change",
        category: "Maintenance",
        unitPrice: 450,
      },
      {
        id: "service-2",
        label: "Wheel alignment",
        category: "Suspension",
        unitPrice: 900,
      },
    ];

    expect(filterServicePickerOptions(services, "suspension")).toEqual([services[1]]);
  });
});
