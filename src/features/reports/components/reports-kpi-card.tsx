import {
  InteractiveStatCardLink,
  interactiveStatCardClassName,
} from "@/components/shared/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import type { ReportMetric } from "@/features/reports/types";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

export function ReportsKpiCard({
  metric,
  href,
}: {
  metric: ReportMetric;
  href?: string;
}) {
  const card = (
    <Card
      className={cn(
        // Non-clickable reports cards keep a light resting shadow; clickable ones
        // match StatCard so hover elevation/border feedback is identical.
        href ? interactiveStatCardClassName : "border-border/70 shadow-sm",
      )}
    >
      <CardContent className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {metric.label}
        </p>
        <p className="mt-3 text-2xl font-semibold text-foreground">
          {formatMetric(metric.value, metric.kind)}
        </p>
        {metric.helper ? (
          <p className="mt-2 text-sm leading-5 text-muted-foreground">{metric.helper}</p>
        ) : null}
      </CardContent>
    </Card>
  );

  if (!href) {
    return card;
  }

  return <InteractiveStatCardLink href={href}>{card}</InteractiveStatCardLink>;
}

function formatMetric(value: number, kind: ReportMetric["kind"]) {
  if (kind === "currency") {
    return formatCurrency(value);
  }

  if (kind === "quantity") {
    return trimNumeric(value);
  }

  return String(value);
}

function trimNumeric(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
}
