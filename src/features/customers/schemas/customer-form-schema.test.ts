import { describe, expect, it } from "vitest";

import {
  customerFormSchema,
  deriveCustomerDisplayName,
} from "@/features/customers/schemas/customer-form-schema";

describe("customerFormSchema", () => {
  it("requires first and last name for individuals", () => {
    const result = customerFormSchema.safeParse({
      customerType: "individual",
      firstName: "",
      lastName: "",
      companyName: "",
      contactNumber: "",
      email: "",
      address: "",
      notes: "",
      status: "active",
      createPortalLogin: false,
    });

    expect(result.success).toBe(false);
  });

  it("requires email when creating a portal login", () => {
    const result = customerFormSchema.safeParse({
      customerType: "individual",
      firstName: "Maria",
      lastName: "Santos",
      companyName: "",
      contactNumber: "",
      email: "",
      address: "",
      notes: "",
      status: "active",
      createPortalLogin: true,
    });

    expect(result.success).toBe(false);
  });

  it("derives display name for company customers", () => {
    const displayName = deriveCustomerDisplayName({
      customerType: "company",
      firstName: "",
      lastName: "",
      companyName: "ABC Fleet Services",
      contactNumber: "",
      email: "",
      address: "",
      notes: "",
      status: "active",
      createPortalLogin: false,
    });

    expect(displayName).toBe("ABC Fleet Services");
  });
});
