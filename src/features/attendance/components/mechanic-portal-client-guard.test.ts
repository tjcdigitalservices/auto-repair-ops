import { describe, expect, it } from "vitest";

import {
  getMechanicPortalClientGuardScript,
  installMechanicPortalClientGuard,
  isKnownExternalJsonRpcError,
} from "@/features/attendance/mechanic-portal-client-guard";

describe("isKnownExternalJsonRpcError", () => {
  it("matches the known external JSON-RPC rejection payload", () => {
    expect(
      isKnownExternalJsonRpcError({
        code: -32603,
        message: "Internal JSON-RPC error.",
      }),
    ).toBe(true);
  });

  it("does not match other error-like payloads", () => {
    expect(
      isKnownExternalJsonRpcError({
        code: -32000,
        message: "Something else",
      }),
    ).toBe(false);
    expect(isKnownExternalJsonRpcError(new Error("Internal JSON-RPC error."))).toBe(false);
    expect(isKnownExternalJsonRpcError(null)).toBe(false);
  });

  it("installs the guard only once", () => {
    installMechanicPortalClientGuard();
    installMechanicPortalClientGuard();

    expect(
      (window as Window & { __mechanicPortalClientGuardInstalled?: boolean })
        .__mechanicPortalClientGuardInstalled,
    ).toBe(true);
  });

  it("builds a guard script that runs before portal hydration", () => {
    const script = getMechanicPortalClientGuardScript();

    expect(script).toContain("window.addEventListener");
    expect(script).toContain("unhandledrejection");
    expect(script).toContain("stopImmediatePropagation");
    expect(script).toContain("Internal JSON-RPC error.");
  });
});
