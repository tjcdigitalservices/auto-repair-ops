import { Check } from "lucide-react";

import type {
  JobOrderWorkflowTimelineStep,
  JobOrderWorkflowTimelineStepState,
} from "@/features/job-orders/utils";
import { formatDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";

function TimelineMarker({ state }: { state: JobOrderWorkflowTimelineStepState }) {
  if (state === "completed") {
    return (
      <span className="relative z-10 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
        <Check className="size-3" strokeWidth={3} />
      </span>
    );
  }

  if (state === "current") {
    return (
      <span className="relative z-10 flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-sky-500 bg-white">
        <span className="size-2 rounded-full bg-sky-500" />
      </span>
    );
  }

  return (
    <span className="relative z-10 size-5 shrink-0 rounded-full border-2 border-slate-200 bg-white" />
  );
}

function TimelineMeta({
  state,
  timestamp,
}: {
  state: JobOrderWorkflowTimelineStepState;
  timestamp: string | null;
}) {
  if (state === "pending") {
    return <span className="shrink-0 text-xs text-muted-foreground">Pending</span>;
  }

  if (!timestamp) {
    return null;
  }

  return (
    <span className="shrink-0 text-right text-xs text-muted-foreground">
      {formatDateTime(timestamp)}
    </span>
  );
}

export function JobOrderWorkflowTimeline({ steps }: { steps: JobOrderWorkflowTimelineStep[] }) {
  return (
    <ol className="relative space-y-0">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;

        return (
          <li key={step.id} className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast ? (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[9px] top-5 h-[calc(100%-4px)] w-px",
                  step.state === "completed" ? "bg-emerald-300" : "bg-slate-200",
                )}
              />
            ) : null}

            <TimelineMarker state={step.state} />

            <div className="flex min-w-0 flex-1 items-start justify-between gap-3 pt-0.5">
              <p
                className={cn(
                  "text-sm",
                  step.state === "current"
                    ? "font-semibold text-sky-600"
                    : step.state === "completed"
                      ? "font-medium text-slate-700"
                      : "text-muted-foreground",
                )}
              >
                {step.label}
              </p>
              <TimelineMeta state={step.state} timestamp={step.timestamp} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
