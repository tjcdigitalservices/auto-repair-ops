"use client";

import { useLayoutEffect } from "react";

import { installMechanicPortalClientGuard } from "@/features/attendance/mechanic-portal-client-guard";

installMechanicPortalClientGuard();

export function MechanicPortalClientGuard() {
  useLayoutEffect(() => {
    installMechanicPortalClientGuard();
  }, []);

  return null;
}
