import { describe, expect, it } from "vitest";

import {
  buildCustomerTemporaryPassword,
  normalizeCustomerLoginPart,
  normalizeCustomerPortalEmail,
} from "@/features/customers/customer-login";

describe("customer-login helpers", () => {
  it("normalizeCustomerLoginPart strips accents and punctuation", () => {
    expect(normalizeCustomerLoginPart("Dela Cruz")).toBe("delacruz");
    expect(normalizeCustomerLoginPart("José")).toBe("jose");
  });

  it("buildCustomerTemporaryPassword prefers last name", () => {
    const year = new Date().getFullYear();
    expect(
      buildCustomerTemporaryPassword({ lastName: "Santos", companyName: "Fleet Co" }),
    ).toBe(`santos@${year}`);
  });

  it("buildCustomerTemporaryPassword falls back to company name", () => {
    const year = new Date().getFullYear();
    expect(
      buildCustomerTemporaryPassword({ lastName: "", companyName: "Santos Logistics" }),
    ).toBe(`santoslogistics@${year}`);
  });

  it("normalizeCustomerPortalEmail lowercases and trims", () => {
    expect(normalizeCustomerPortalEmail("  Ada@Example.COM ")).toBe("ada@example.com");
  });
});
