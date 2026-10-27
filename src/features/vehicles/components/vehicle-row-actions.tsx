"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { TableRowActionsMenu, TableRowActionsMenuButton, TableRowActionsMenuLink } from "@/components/shared/table-row-actions-menu";
import { deleteVehicleAction } from "@/features/vehicles/actions/vehicle-actions";
import { deleteSandboxVehicleAction } from "@/features/sandbox/form-actions";
import { useBoundFormAction } from "@/features/sandbox/use-bound-action";

export function VehicleRowActions({
  vehicleId,
  vehicleLabel,
}: {
  vehicleId: string;
  vehicleLabel: string;
}) {
  const deleteAction = useBoundFormAction(deleteVehicleAction, deleteSandboxVehicleAction);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <>
      <TableRowActionsMenu label={`Open row actions for ${vehicleLabel}`}>
        <TableRowActionsMenuLink href={`/vehicles/${vehicleId}/edit`} label="Edit vehicle" icon={Pencil} />
        <TableRowActionsMenuButton
          label="Delete vehicle"
          icon={Trash2}
          tone="destructive"
          onSelect={() => setIsDeleteOpen(true)}
        />
      </TableRowActionsMenu>
      <ConfirmActionDialog
        title={`Delete ${vehicleLabel}?`}
        description="This vehicle will be removed permanently if it is not already used in workshop records."
        confirmLabel="Delete vehicle"
        cancelLabel="Keep vehicle"
        action={deleteAction}
        fields={[{ name: "vehicleId", value: vehicleId }]}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </>
  );
}
