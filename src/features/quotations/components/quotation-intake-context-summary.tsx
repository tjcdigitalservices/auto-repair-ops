"use client";

import { Button } from "@/components/ui/button";
import { splitQuotationVehicleIntakeLabel } from "@/features/quotations/utils";

export function QuotationIntakeContextSummary({
  customerLabel,
  vehicleLabel,
  onChangeCustomer,
  onChangeVehicle,
}: {
  customerLabel: string;
  vehicleLabel: string;
  onChangeCustomer: () => void;
  onChangeVehicle: () => void;
}) {
  const vehicleDisplay = splitQuotationVehicleIntakeLabel(vehicleLabel);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <IntakeContextCard
        label="Customer"
        primary={customerLabel}
        onChange={onChangeCustomer}
      />
      <IntakeContextCard
        label="Vehicle"
        primary={vehicleDisplay.title}
        secondary={vehicleDisplay.plate || undefined}
        onChange={onChangeVehicle}
      />
    </div>
  );
}

function IntakeContextCard({
  label,
  primary,
  secondary,
  onChange,
}: {
  label: string;
  primary: string;
  secondary?: string;
  onChange: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/15 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </p>
          <p className="font-semibold text-foreground">{primary}</p>
          {secondary ? (
            <p className="text-sm font-medium text-muted-foreground">{secondary}</p>
          ) : null}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onChange}>
          Change
        </Button>
      </div>
    </div>
  );
}
