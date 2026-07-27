"use client";

import { AlertTriangle } from "lucide-react";

import { DAILY_ARRIVALS_SETUP_MESSAGE } from "@/features/quick-access/arrivals/arrival-queue-schema";

export function ArrivalQueueSetupNotice({ show }: { show: boolean }) {
  if (!show) {
    return null;
  }

  return (
    <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <p>{DAILY_ARRIVALS_SETUP_MESSAGE}</p>
    </div>
  );
}
