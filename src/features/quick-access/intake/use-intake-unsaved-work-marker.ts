"use client";

import { useEffect } from "react";

import { markActiveIntakeUnsavedWork } from "@/features/quick-access/intake/active-intake-session";

export function useIntakeUnsavedWorkMarker(active: boolean) {
  useEffect(() => {
    markActiveIntakeUnsavedWork(active);

    return () => {
      markActiveIntakeUnsavedWork(false);
    };
  }, [active]);
}

export function QuotationEditIntakeMarker({ isDraft }: { isDraft: boolean }) {
  useIntakeUnsavedWorkMarker(isDraft);
  return null;
}
