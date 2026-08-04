import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RevenueTrendPoint, ReportGroupBy } from "@/features/reports/types";
import { formatCurrency } from "@/lib/currency";

const SVG_HEIGHT = 260;
const SVG_WIDTH = 860;
const PADDING = { top: 20, right: 52, bottom: 48, left: 56 };
const REPORT_NAVY = "hsl(var(--brand-navy))";
const REPORT_NAVY_MUTED = "hsl(var(--brand-navy) / 0.28)";
const REPORT_RED_ACCENT = "hsl(var(--brand-red))";
const REPORT_GRID = "hsl(var(--border))";
const TICK_COUNT = 5;

export type RevenueTrendChartVariant = "quotation" | "invoice";

const TREND_CHART_COPY: Record<
  RevenueTrendChartVariant,
  {
    title: string;
    description: (groupBy: ReportGroupBy) => string;
    primaryLegendLabel: string;
    primaryTotalLabel: string;
    ariaLabel: string;
  }
> = {
  quotation: {
    title: "Quotation and service trend",
    description: (groupBy) => `Approved quotation value and vehicles released, grouped ${groupBy}.`,
    primaryLegendLabel: "Approved quotation value",
    primaryTotalLabel: "Total approved quotation value",
    ariaLabel: "Trend chart for approved quotation value and vehicles released",
  },
  invoice: {
    title: "Invoice trend",
    description: (groupBy) => `Invoice value and vehicles released, grouped ${groupBy}.`,
    primaryLegendLabel: "Invoice value",
    primaryTotalLabel: "Total invoice value",
    ariaLabel: "Trend chart for invoice value and vehicles released",
  },
};

export function RevenueTrendChart({
  data,
  groupBy,
  variant = "quotation",
}: {
  data: RevenueTrendPoint[];
  groupBy: ReportGroupBy;
  variant?: RevenueTrendChartVariant;
}) {
  const copy = TREND_CHART_COPY[variant];
  const chartHeight = SVG_HEIGHT - PADDING.top - PADDING.bottom;
  const chartWidth = SVG_WIDTH - PADDING.left - PADDING.right;
  const maxApprovedValue = Math.max(...data.map((point) => point.approvedQuotationValue), 0);
  const maxReleased = Math.max(...data.map((point) => point.vehiclesReleased), 0);
  const leftAxisMax = computeAxisMax(maxApprovedValue);
  const rightAxisMax = computeAxisMax(maxReleased, { integer: true });
  const leftTicks = buildAxisTicks(leftAxisMax, TICK_COUNT);
  const rightTicks = buildAxisTicks(rightAxisMax, TICK_COUNT, { integer: true });
  const labelStride = Math.max(1, Math.ceil(data.length / 8));

  const points = data.map((point, index) => {
    const step = data.length > 1 ? chartWidth / data.length : chartWidth;
    const x = PADDING.left + step * index + step / 2;
    const barWidth = Math.max(Math.min(step * 0.5, 28), 12);
    const releasedHeight =
      rightAxisMax > 0 ? (point.vehiclesReleased / rightAxisMax) * chartHeight : 0;
    const approvedValueY = scaleToAxis(point.approvedQuotationValue, leftAxisMax, chartHeight);

    return {
      ...point,
      x,
      barX: x - barWidth / 2,
      barWidth,
      releasedY: PADDING.top + chartHeight - releasedHeight,
      releasedHeight,
      approvedValueY,
      showLabel: index % labelStride === 0 || index === data.length - 1,
    };
  });

  const approvedValuePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.approvedValueY}`)
    .join(" ");

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.description(groupBy)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
          <LegendSwatch color={REPORT_NAVY_MUTED} label="Vehicles released" />
          <LegendSwatch color={REPORT_NAVY} label={copy.primaryLegendLabel} />
        </div>

        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No trend data in the selected period.</p>
        ) : (
          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
              className="min-w-[720px]"
              role="img"
              aria-label={copy.ariaLabel}
            >
              {leftTicks.map((tick, index) => {
                const y = scaleToAxis(tick, leftAxisMax, chartHeight);
                return (
                  <g key={`left-grid-${index}`}>
                    <line
                      x1={PADDING.left}
                      x2={SVG_WIDTH - PADDING.right}
                      y1={y}
                      y2={y}
                      stroke={REPORT_GRID}
                      strokeDasharray="4 4"
                    />
                    <text
                      x={PADDING.left - 8}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-slate-500 text-[10px]"
                    >
                      {formatAxisCurrency(tick)}
                    </text>
                  </g>
                );
              })}

              {rightTicks.map((tick, index) => {
                const y = scaleToAxis(tick, rightAxisMax, chartHeight);
                return (
                  <text
                    key={`right-tick-${index}`}
                    x={SVG_WIDTH - PADDING.right + 8}
                    y={y + 4}
                    textAnchor="start"
                    className="fill-slate-500 text-[10px]"
                  >
                    {tick}
                  </text>
                );
              })}

              {points.map((point) => (
                <g key={point.key}>
                  <rect
                    x={point.barX}
                    y={point.releasedY}
                    width={point.barWidth}
                    height={Math.max(point.releasedHeight, point.vehiclesReleased > 0 ? 2 : 0)}
                    rx="6"
                    fill={REPORT_NAVY_MUTED}
                    opacity="0.95"
                  />
                  {point.showLabel ? (
                    <text
                      x={point.x}
                      y={SVG_HEIGHT - 16}
                      textAnchor="middle"
                      className="fill-slate-500 text-[10px]"
                    >
                      {point.label}
                    </text>
                  ) : null}
                </g>
              ))}

              {approvedValuePath ? (
                <>
                  <path d={approvedValuePath} fill="none" stroke={REPORT_NAVY} strokeWidth="3" />
                  {points.map((point) => (
                    <circle
                      key={`${point.key}-circle`}
                      cx={point.x}
                      cy={point.approvedValueY}
                      r="4"
                      fill={REPORT_RED_ACCENT}
                    />
                  ))}
                </>
              ) : null}
            </svg>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <MiniSummary
            label={copy.primaryTotalLabel}
            value={formatCurrency(data.reduce((sum, point) => sum + point.approvedQuotationValue, 0))}
          />
          <MiniSummary
            label="Total vehicles released"
            value={String(data.reduce((sum, point) => sum + point.vehiclesReleased, 0))}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function scaleToAxis(value: number, axisMax: number, chartHeight: number) {
  if (axisMax <= 0) {
    return PADDING.top + chartHeight;
  }

  const ratio = Math.min(Math.max(value / axisMax, 0), 1);
  return PADDING.top + chartHeight - ratio * chartHeight;
}

function computeAxisMax(value: number, options?: { integer?: boolean }) {
  if (value <= 0) {
    return options?.integer ? 1 : 1;
  }

  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const niceNormalized =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  const max = niceNormalized * magnitude;

  return options?.integer ? Math.max(1, Math.ceil(max)) : max;
}

function buildAxisTicks(max: number, count: number, options?: { integer?: boolean }) {
  if (count <= 1) {
    return [0];
  }

  if (options?.integer) {
    const axisMax = Math.max(1, Math.ceil(max));

    if (axisMax <= count - 1) {
      return Array.from({ length: axisMax + 1 }, (_, index) => index);
    }
  }

  const step = max / (count - 1);
  const ticks = Array.from({ length: count }, (_, index) => {
    const tick = step * index;
    return options?.integer ? Math.round(tick) : tick;
  });

  if (!options?.integer) {
    return ticks;
  }

  return ticks.filter((tick, index, array) => index === 0 || tick !== array[index - 1]);
}

function formatAxisCurrency(value: number) {
  if (value >= 1_000_000) {
    return `₱${trimTrailingZero(value / 1_000_000)}M`;
  }

  if (value >= 1_000) {
    return `₱${trimTrailingZero(value / 1_000)}K`;
  }

  return formatCurrency(value);
}

function trimTrailingZero(value: number) {
  const formatted = value.toFixed(1);
  return formatted.endsWith(".0") ? formatted.slice(0, -2) : formatted;
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
}

function MiniSummary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

export {
  buildAxisTicks,
  computeAxisMax,
  formatAxisCurrency,
  scaleToAxis,
};
