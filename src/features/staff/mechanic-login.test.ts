import { describe, expect, it } from "vitest";

import {
  buildMechanicPortalUsername,
  buildMechanicTemporaryPassword,
  normalizeMechanicPortalUsernameInput,
} from "@/features/staff/mechanic-login";

describe("buildMechanicPortalUsername", () => {
  it("uses lastname@domain when available", () => {
    expect(
      buildMechanicPortalUsername({
        firstName: "Juan",
        lastName: "Delacruz",
        takenUsernames: [],
      }),
    ).toBe("delacruz@sayautocare.com");
  });

  it("falls back to firstname.lastname when lastname is taken", () => {
    expect(
      buildMechanicPortalUsername({
        firstName: "Juan",
        lastName: "Delacruz",
        takenUsernames: ["delacruz@sayautocare.com"],
      }),
    ).toBe("juan.delacruz@sayautocare.com");
  });

  it("adds numeric suffixes for further duplicates", () => {
    expect(
      buildMechanicPortalUsername({
        firstName: "Juan",
        lastName: "Delacruz",
        takenUsernames: [
          "delacruz@sayautocare.com",
          "juan.delacruz@sayautocare.com",
        ],
      }),
    ).toBe("juan.delacruz2@sayautocare.com");
  });
});

describe("buildMechanicTemporaryPassword", () => {
  it("uses lastname@current year", () => {
    expect(buildMechanicTemporaryPassword("Delacruz")).toBe(
      `delacruz@${new Date().getFullYear()}`,
    );
  });
});

describe("normalizeMechanicPortalUsernameInput", () => {
  it("appends the mechanic portal domain when missing", () => {
    expect(normalizeMechanicPortalUsernameInput("delacruz")).toBe(
      "delacruz@sayautocare.com",
    );
  });
});
