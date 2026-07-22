"use client";

import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { VehicleAddLookupOptionDialog } from "@/features/vehicles/components/vehicle-add-lookup-option-dialog";
import { VehicleLookupOptionRowActions } from "@/features/vehicles/components/vehicle-lookup-row-actions";
import type { VehicleLookupOptionGroup } from "@/features/vehicles/types";

export function VehicleLookupOptionSection({ group }: { group: VehicleLookupOptionGroup }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <VehicleAddLookupOptionDialog lookupType={group.lookupType} label={group.label} />
      </div>

      {group.items.length === 0 ? (
        <EmptyState
          title="No options yet"
          description="Add the first dropdown value for this category."
          action={
            <VehicleAddLookupOptionDialog lookupType={group.lookupType} label={group.label} />
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/70 bg-background">
          <ul className="divide-y divide-border/70">
            {group.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm text-foreground">{item.label}</span>
                  {item.status !== "active" ? (
                    <StatusBadge tone="neutral" variant="table">
                      Inactive
                    </StatusBadge>
                  ) : null}
                </div>
                <VehicleLookupOptionRowActions item={item} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
