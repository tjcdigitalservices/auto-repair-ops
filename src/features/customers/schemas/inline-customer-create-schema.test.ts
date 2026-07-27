import { describe, expect, it } from "vitest";

import { inlineCustomerCreateSchema } from "@/features/customers/schemas/inline-customer-create-schema";

describe("inlineCustomerCreateSchema", () => {
  it("requires first name, last name, and mobile number", () => {
    const result = inlineCustomerCreateSchema.safeParse({
      firstName: "",
      lastName: "",
      contactNumber: "",
      email: "",
      address: "",
      notes: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.firstName).toBeDefined();
      expect(result.error.flatten().fieldErrors.lastName).toBeDefined();
      expect(result.error.flatten().fieldErrors.contactNumber).toBeDefined();
    }
  });

  it("accepts valid individual customer payload", () => {
    const result = inlineCustomerCreateSchema.safeParse({
      firstName: "Ana",
      lastName: "Reyes",
      contactNumber: "09171234567",
      email: "",
      address: "",
      notes: "",
    });

    expect(result.success).toBe(true);
  });
});
