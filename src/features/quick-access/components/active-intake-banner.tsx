"use client";

import { DateTime } from "luxon";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { touchDailyArrivalActivityAction } from "@/features/quick-access/arrivals/arrival-queue-actions";
import { useActiveIntake } from "@/features/quick-access/intake/active-intake-provider";

export function ActiveIntakeBanner() {
  const router = useRouter();
  const { session, finishIntake } = useActiveIntake();

  if (!session) {
    return null;
  }

  const startedLabel = DateTime.fromISO(session.startedAt).toLocaleString(DateTime.TIME_SIMPLE);

  function handleFinishIntake() {
    if (!session) {
      return;
    }

    const vehicleId = session.vehicleId;
    finishIntake();
    void touchDailyArrivalActivityAction(vehicleId);
    router.push("/quick-access?finished=1&view=queue");
  }

  return (
    <section className="rounded-2xl border border-primary/25 bg-primary/[0.06] px-4 py-4 shadow-sm sm:px-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Active Intake</p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <IntakeBannerField label="Vehicle" value={session.vehicleLabel} />
            <IntakeBannerField label="Plate" value={session.plateNumber || "No plate"} />
            <IntakeBannerField label="Customer" value={session.customerName} />
            <IntakeBannerField label="Workflow Status" value={session.workflowStatusLabel} />
            <IntakeBannerField label="Started" value={startedLabel} />
          </div>
        </div>
        <Button type="button" variant="outline" className="shrink-0" onClick={handleFinishIntake}>
          Finish Intake
        </Button>
      </div>
    </section>
  );
}

function IntakeBannerField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function ActiveIntakeFinishedNotice({ show }: { show: boolean }) {
  if (!show) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
      <CheckCircle2 className="size-4 shrink-0" />
      <span>Intake completed. You can serve the next arrival or scan another vehicle.</span>
    </div>
  );
}
