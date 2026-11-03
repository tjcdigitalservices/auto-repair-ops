"use client";

import { Trash2 } from "lucide-react";

import {
  TableRowActionsMenu,
  TableRowActionsMenuConfirm,
  TableRowActionsMenuSeparator,
} from "@/components/shared/table-row-actions-menu";
import {
  deleteSandboxVehicleMakeAction,
  deleteSandboxVehicleModelAction,
  updateSandboxVehicleLookupOptionStatusAction,
  updateSandboxVehicleMakeStatusAction,
  updateSandboxVehicleModelStatusAction,
} from "@/features/sandbox/form-actions";
import { useBoundFormAction } from "@/features/sandbox/use-bound-action";
import {
  deleteVehicleMakeAction,
  deleteVehicleModelAction,
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

export function VehicleMakeRowActions({ make }: { make: VehicleMakeItem }) {
  const nextStatus = make.status === "active" ? "inactive" : "active";
  const statusAction = useBoundFormAction(
    updateVehicleMakeStatusAction,
    updateSandboxVehicleMakeStatusAction,
  );
  const deleteAction = useBoundFormAction(deleteVehicleMakeAction, deleteSandboxVehicleMakeAction);

  return (
    <TableRowActionsMenu label={`Open actions for ${make.name}`}>
      <LookupStatusFormMenuItem
        label={make.status === "active" ? "Deactivate make" : "Activate make"}
        action={statusAction}
        fields={{
          makeId: make.id,
          status: nextStatus,
        }}
        tone={make.status === "active" ? "destructive" : "default"}
        iconName="power"
      />
      <TableRowActionsMenuSeparator />
      <TableRowActionsMenuConfirm
        label="Delete make"
        title={`Delete ${make.name}?`}
        description="This make and all of its models will be removed from the registration catalog. Existing vehicle records keep their saved make and model text."
        confirmLabel="Delete make"
        cancelLabel="Keep make"
        action={deleteAction}
        fields={[{ name: "makeId", value: make.id }]}
        icon={Trash2}
        tone="destructive"
      />
    </TableRowActionsMenu>
  );
}

export function VehicleModelRowActions({ model }: { model: VehicleModelItem }) {
  const nextStatus = model.status === "active" ? "inactive" : "active";
  const modelLabel = model.makeName ? `${model.makeName} ${model.name}` : model.name;
  const statusAction = useBoundFormAction(
    updateVehicleModelStatusAction,
    updateSandboxVehicleModelStatusAction,
  );
  const deleteAction = useBoundFormAction(deleteVehicleModelAction, deleteSandboxVehicleModelAction);

  return (
    <TableRowActionsMenu label={`Open actions for ${model.name}`}>
      <LookupStatusFormMenuItem
        label={model.status === "active" ? "Deactivate model" : "Activate model"}
        action={statusAction}
        fields={{
          modelId: model.id,
          status: nextStatus,
        }}
        tone={model.status === "active" ? "destructive" : "default"}
        iconName="power"
      />
      <TableRowActionsMenuSeparator />
      <TableRowActionsMenuConfirm
        label="Delete model"
        title={`Delete ${modelLabel}?`}
        description="This model will be removed from the registration catalog. Existing vehicle records keep their saved make and model text."
        confirmLabel="Delete model"
        cancelLabel="Keep model"
        action={deleteAction}
        fields={[{ name: "modelId", value: model.id }]}
        icon={Trash2}
        tone="destructive"
      />
    </TableRowActionsMenu>
  );
}

export function VehicleLookupOptionRowActions({ item }: { item: VehicleLookupOptionItem }) {
  const nextStatus = item.status === "active" ? "inactive" : "active";
  const statusAction = useBoundFormAction(
    updateVehicleLookupOptionStatusAction,
    updateSandboxVehicleLookupOptionStatusAction,
  );

  return (
    <TableRowActionsMenu label={`Open actions for ${item.label}`}>
      <LookupStatusFormMenuItem
        label={item.status === "active" ? "Deactivate option" : "Activate option"}
        action={statusAction}
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
