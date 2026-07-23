import { describe, expect, it } from "vitest";

import {
  getMergeVariable,
  listMergeVariableGroups,
  listMergeVariables,
  registerMergeVariable,
} from "@/components/document-engine/variables/registry";

describe("merge variable registry", () => {
  it("registers customer, vehicle, and company variables", () => {
    const groups = listMergeVariableGroups().map((entry) => entry.group).sort();

    expect(groups).toEqual(["Company", "Customer", "Vehicle"]);
    expect(getMergeVariable("customer.name")?.label).toBe("Customer Name");
    expect(getMergeVariable("vehicle.plateNumber")?.label).toBe("Plate Number");
    expect(getMergeVariable("company.vatNumber")?.label).toBe("VAT Number");
  });

  it("allows future modules to register additional variables", () => {
    const initialCount = listMergeVariables().length;

    registerMergeVariable({
      id: "invoice.number",
      label: "Invoice Number",
      group: "Invoice",
      sampleValue: "INV-0001",
    });

    expect(listMergeVariables()).toHaveLength(initialCount + 1);
    expect(getMergeVariable("invoice.number")?.sampleValue).toBe("INV-0001");
  });
});
