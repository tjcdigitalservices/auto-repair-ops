"use client";

import {
  updateVehicleLookupOptionStatusAction,
  updateVehicleMakeStatusAction,
  updateVehicleModelStatusAction,
} from "@/features/vehicles/actions/vehicle-lookup-actions";
import type {
  VehicleLookupOptionItem,
  VehicleMakeItem,
  VehicleModelItem,
} from "@/features/vehicles/types";

import { LookupStatusFormMenuItem } from "@/features/vehicles/components/vehicle-lookup-status-menu-item";
import { TableRowActionsMenu } from "@/components/shared/table-row-actions-menu";

export function VehicleMakeRowActions({ make }: { make: VehicleMakeItem }) {
  const nextStatus = make.status === "active" ? "inactive" : "active";

  return (
    <TableRowActionsMenu label={`Open actions for ${make.name}`}>
      <LookupStatusFormMenuItem
        label={make.status === "active" ? "Deactivate make" : "Activate make"}
        action={updateVehicleMakeStatusAction}
        fields={{
          makeId: make.id,
          status: nextStatus,
        }}
        tone={make.status === "active" ? "destructive" : "default"}
        iconName="power"
      />
    </TableRowActionsMenu>
  );
}

export function VehicleModelRowActions({ model }: { model: VehicleModelItem }) {
  const nextStatus = model.status === "active" ? "inactive" : "active";

  return (
    <TableRowActionsMenu label={`Open actions for ${model.name}`}>
      <LookupStatusFormMenuItem
        label={model.status === "active" ? "Deactivate model" : "Activate model"}
        action={updateVehicleModelStatusAction}
        fields={{
          modelId: model.id,
          status: nextStatus,
        }}
        tone={model.status === "active" ? "destructive" : "default"}
        iconName="power"
      />
    </TableRowActionsMenu>
  );
}

export function VehicleLookupOptionRowActions({ item }: { item: VehicleLookupOptionItem }) {
  const nextStatus = item.status === "active" ? "inactive" : "active";

  return (
    <TableRowActionsMenu label={`Open actions for ${item.label}`}>
      <LookupStatusFormMenuItem
        label={item.status === "active" ? "Deactivate option" : "Activate option"}
        action={updateVehicleLookupOptionStatusAction}
        fields={{
          optionId: item.id,
          status: nextStatus,
        }}
        tone={item.status === "active" ? "destructive" : "default"}
        iconName="power"
      />
    </TableRowActionsMenu>
  );
}
