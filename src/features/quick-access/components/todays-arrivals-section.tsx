"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";

import { AppLink } from "@/components/shared/app-link";
import { Button } from "@/components/ui/button";
import {
  formatArrivalAbsoluteTime,
  formatArrivalClockTime,
  formatArrivalRelativeTime,
} from "@/features/quick-access/arrivals/arrival-time-format";
import {
  matchesArrivalQueueFilter,
  resolveArrivalCardPrimaryLabel,
  resolveArrivalQueueStatus,
  summarizeArrivalQueue,
  ARRIVAL_QUEUE_STATUS_LABELS,
  type ArrivalQueueFilter,
  type ArrivalQueueItem,
} from "@/features/quick-access/arrivals/arrival-queue-types";
import { buildQuickAccessIntakeHref } from "@/features/quick-access/intake/active-intake-session";
import { useActiveIntake } from "@/features/quick-access/intake/active-intake-provider";
import { cn } from "@/lib/utils";

const FILTERS: Array<{ id: ArrivalQueueFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "waiting_intake", label: "Waiting Intake" },
  { id: "current_intake", label: "Current Intake" },
  { id: "in_progress", label: "In Progress" },
  { id: "ready", label: "Ready" },
  { id: "completed", label: "Completed" },
];

export function TodaysArrivalsSection({
  items,
  focusVehicleId,
  onManualAdd,
}: {
  items: ArrivalQueueItem[];
  focusVehicleId?: string | null;
  onManualAdd?: () => void;
}) {
  const { session } = useActiveIntake();
  const [filter, setFilter] = useState<ArrivalQueueFilter>("all");

  const enrichedItems = useMemo(() => {
    if (!session) {
      return items;
    }

    return items.map((item) => {
      if (item.vehicleId !== session.vehicleId) {
        return item;
      }

      const queueStatus = resolveArrivalQueueStatus({
        workflowState: item.primaryAction.state,
        jobOrderStatus: null,
        isCurrentIntake: true,
        intakeStartedAt: item.intakeStartedAt,
      });

      return {
        ...item,
        queueStatus,
        queueStatusLabel: ARRIVAL_QUEUE_STATUS_LABELS[queueStatus],
        intakeActionLabel: resolveArrivalCardPrimaryLabel({
          queueStatus,
          primaryAction: item.primaryAction,
          isCurrentIntake: true,
        }),
      };
    });
  }, [items, session]);

  const summary = useMemo(() => summarizeArrivalQueue(enrichedItems), [enrichedItems]);
  const filteredItems = useMemo(
    () => enrichedItems.filter((item) => matchesArrivalQueueFilter(item.queueStatus, filter)),
    [enrichedItems, filter],
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Today&apos;s Arrivals</h2>
          <p className="text-sm text-muted-foreground">
            Manage incoming vehicles and start or resume intake from one queue.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" className="h-10" onClick={onManualAdd}>
          <Plus className="size-4" />
          Manual Add
        </Button>
      </div>

      <ArrivalSummaryStrip summary={summary} />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((entry) => (
          <Button
            key={entry.id}
            type="button"
            size="sm"
            variant={filter === entry.id ? "default" : "outline"}
            className="shrink-0"
            onClick={() => setFilter(entry.id)}
          >
            {entry.label}
          </Button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          No arrivals in this filter yet. Search, scan, or add a vehicle to begin.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => (
            <ArrivalCard
              key={item.id}
              item={item}
              highlighted={focusVehicleId === item.vehicleId}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ArrivalSummaryStrip({
  summary,
}: {
  summary: ReturnType<typeof summarizeArrivalQueue>;
}) {
  const entries = [
    { label: "Waiting", value: summary.waiting },
    { label: "Current Intake", value: summary.currentIntake },
    { label: "In Service", value: summary.inService },
    { label: "Ready", value: summary.ready },
    { label: "Released", value: summary.released },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {entries.map((entry) => (
        <div
          key={entry.label}
          className="rounded-xl border border-border/70 bg-background px-3 py-2.5 text-center shadow-sm"
        >
          <p className="text-xs text-muted-foreground">{entry.label}</p>
          <p className="mt-0.5 text-xl font-semibold tabular-nums text-foreground">{entry.value}</p>
        </div>
      ))}
    </div>
  );
}

function ArrivalCard({ item, highlighted }: { item: ArrivalQueueItem; highlighted?: boolean }) {
  const cardRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (highlighted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [highlighted]);

  const isIntakeAction =
    item.intakeActionLabel === "Start Intake" || item.intakeActionLabel === "Continue Intake";
  const href = isIntakeAction
    ? buildQuickAccessIntakeHref(item.customerId, item.vehicleId)
    : item.primaryAction.href.startsWith("#")
      ? `${buildQuickAccessIntakeHref(item.customerId, item.vehicleId)}${item.primaryAction.href}`
      : item.primaryAction.href;

  return (
    <article
      ref={cardRef}
      id={`arrival-${item.vehicleId}`}
      className={cn(
        "flex flex-col rounded-2xl border bg-background p-4 shadow-sm",
        highlighted ? "border-primary ring-2 ring-primary/20" : "border-border/70",
      )}
    >
      <p className="text-base font-semibold tabular-nums text-foreground">
        {item.plateNumber || "No plate"}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">{item.vehicleLabel}</p>
      <p className="text-sm text-muted-foreground">{item.customerName}</p>

      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
        <p title={formatArrivalAbsoluteTime(item.arrivedAt)}>
          Arrived {formatArrivalRelativeTime(item.arrivedAt)} · {formatArrivalClockTime(item.arrivedAt)}
        </p>
        {item.intakeStartedAt ? (
          <p title={formatArrivalAbsoluteTime(item.intakeStartedAt)}>
            Started {formatArrivalRelativeTime(item.intakeStartedAt)}
          </p>
        ) : null}
        <p title={formatArrivalAbsoluteTime(item.lastActivityAt)}>
          Active {formatArrivalRelativeTime(item.lastActivityAt)}
        </p>
      </div>

      <div className="mt-3">
        <p className="text-xs text-muted-foreground">Status</p>
        <p className="text-sm font-medium text-foreground">{item.queueStatusLabel}</p>
      </div>

      <Button asChild className="mt-4 h-11 w-full" variant="bluePrimary">
        <AppLink href={href}>{item.intakeActionLabel}</AppLink>
      </Button>
    </article>
  );
}

export function PostFinishIntakePrompt({
  items,
  onScanNext,
}: {
  items: ArrivalQueueItem[];
  onScanNext: () => void;
}) {
  const nextWaiting = items.find((item) => item.queueStatus === "waiting_intake") ?? null;

  if (nextWaiting) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-primary/[0.05] px-4 py-4">
        <p className="text-sm font-semibold text-foreground">Next waiting vehicle</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {nextWaiting.plateNumber || "No plate"} · {nextWaiting.vehicleLabel} · {nextWaiting.customerName}
        </p>
        <Button asChild className="mt-3 h-11" variant="bluePrimary">
          <AppLink href={buildQuickAccessIntakeHref(nextWaiting.customerId, nextWaiting.vehicleId)}>
            Start Next Intake
          </AppLink>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-4">
      <p className="text-sm font-semibold text-foreground">Scan next vehicle</p>
      <p className="mt-1 text-sm text-muted-foreground">No vehicles are waiting for intake right now.</p>
      <Button type="button" className="mt-3 h-11" variant="outline" onClick={onScanNext}>
        Scan Next Vehicle
      </Button>
    </div>
  );
}
