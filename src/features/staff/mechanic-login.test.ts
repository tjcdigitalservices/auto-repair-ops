import { describe, expect, it } from "vitest";

import {
  buildMechanicPortalEmailDomainFromTenant,
  buildMechanicPortalUsername,
  buildMechanicTemporaryPassword,
  normalizeMechanicPortalUsernameInput,
} from "@/features/staff/mechanic-login";

describe("buildMechanicPortalEmailDomainFromTenant", () => {
  it("derives the portal domain from the tenant name", () => {
    expect(
      buildMechanicPortalEmailDomainFromTenant({
        tenantName: "TJC Autoshop",
        tenantSlug: "tjc-main",
      }),
    ).toBe("tjcautoshop.com");

    expect(
      buildMechanicPortalEmailDomainFromTenant({
        tenantName: "Say Auto Care",
        tenantSlug: "say-auto-care",
      }),
    ).toBe("sayautocare.com");
  });

  it("falls back to the tenant slug when the name normalizes to empty", () => {
    expect(
      buildMechanicPortalEmailDomainFromTenant({
        tenantName: "!!!",
        tenantSlug: "tjcautoshop",
      }),
    ).toBe("tjcautoshop.com");
  });
});

describe("buildMechanicPortalUsername", () => {
  it("uses lastname@domain when available", () => {
    expect(
      buildMechanicPortalUsername({
        firstName: "Charlie Mae",
        lastName: "Coyoca",
        emailDomain: "tjcautoshop.com",
        takenUsernames: [],
      }),
    ).toBe("coyoca@tjcautoshop.com");
  });

  it("falls back to firstname.lastname when lastname is taken", () => {
    expect(
      buildMechanicPortalUsername({
        firstName: "Juan",
        lastName: "Delacruz",
        emailDomain: "tjcautoshop.com",
        takenUsernames: ["delacruz@tjcautoshop.com"],
      }),
    ).toBe("juan.delacruz@tjcautoshop.com");
  });

  it("adds numeric suffixes for further duplicates", () => {
    expect(
      buildMechanicPortalUsername({
        firstName: "Juan",
        lastName: "Delacruz",
        emailDomain: "tjcautoshop.com",
        takenUsernames: [
          "delacruz@tjcautoshop.com",
          "juan.delacruz@tjcautoshop.com",
        ],
      }),
    ).toBe("juan.delacruz2@tjcautoshop.com");
  });
});

describe("buildMechanicTemporaryPassword", () => {
  it("uses lastname@current year", () => {
    expect(buildMechanicTemporaryPassword("Coyoca")).toBe(
      `coyoca@${new Date().getFullYear()}`,
    );
  });
});

describe("normalizeMechanicPortalUsernameInput", () => {
  it("appends the tenant portal domain when missing", () => {
    expect(normalizeMechanicPortalUsernameInput("coyoca", "tjcautoshop.com")).toBe(
      "coyoca@tjcautoshop.com",
    );
  });
});
