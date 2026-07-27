"use client";

import { useState } from "react";

import { ModalDialog } from "@/components/shared/modal-dialog";
import { Button } from "@/components/ui/button";
import { useActiveIntake } from "@/features/quick-access/intake/active-intake-provider";

export function ActiveIntakeCameraGuard({
  open,
  onOpenChange,
  onContinueCurrent,
  onSwitchVehicle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinueCurrent: () => void;
  onSwitchVehicle: () => void;
}) {
  const { session, shouldWarnBeforeSwitch } = useActiveIntake();
  const [switchConfirmOpen, setSwitchConfirmOpen] = useState(false);
  const [unsavedConfirmOpen, setUnsavedConfirmOpen] = useState(false);

  if (!session) {
    return null;
  }

  function requestSwitch() {
    if (shouldWarnBeforeSwitch()) {
      setUnsavedConfirmOpen(true);
      return;
    }

    setSwitchConfirmOpen(true);
  }

  function confirmSwitch() {
    setUnsavedConfirmOpen(false);
    setSwitchConfirmOpen(false);
    onOpenChange(false);
    onSwitchVehicle();
  }

  return (
    <>
      <ModalDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Active Intake Detected"
        description="You are already working on a vehicle intake."
        size="md"
      >
        {({ closeDialog }) => (
          <div className="space-y-5">
            <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-4 text-sm">
              <p className="font-semibold text-foreground">{session.vehicleLabel}</p>
              <p className="mt-1 tabular-nums text-muted-foreground">{session.plateNumber || "No plate"}</p>
              <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">Customer</p>
              <p className="font-medium text-foreground">{session.customerName}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Choose an action</p>
              <Button
                type="button"
                className="w-full justify-start"
                variant="bluePrimary"
                onClick={() => {
                  closeDialog();
                  onContinueCurrent();
                }}
              >
                Continue Current Intake
              </Button>
              <Button type="button" className="w-full justify-start" variant="outline" onClick={requestSwitch}>
                Switch to Another Vehicle
              </Button>
              <Button type="button" className="w-full justify-start" variant="ghost" onClick={closeDialog}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </ModalDialog>

      <ModalDialog
        open={switchConfirmOpen}
        onOpenChange={setSwitchConfirmOpen}
        title="Switch to another vehicle?"
        description="The current intake session will be closed before the scanner opens."
        size="md"
      >
        {({ closeDialog }) => (
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeDialog}>
              Keep current intake
            </Button>
            <Button type="button" variant="destructive" onClick={confirmSwitch}>
              Switch vehicle
            </Button>
          </div>
        )}
      </ModalDialog>

      <ModalDialog
        open={unsavedConfirmOpen}
        onOpenChange={setUnsavedConfirmOpen}
        title="You have unsaved changes for this intake"
        description="Leaving now may discard your progress."
        size="md"
      >
        {({ closeDialog }) => (
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeDialog}>
              Stay
            </Button>
            <Button type="button" variant="destructive" onClick={confirmSwitch}>
              Switch anyway
            </Button>
          </div>
        )}
      </ModalDialog>
    </>
  );
}
