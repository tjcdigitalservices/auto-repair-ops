"use client";

import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ModalDialog } from "@/components/shared/modal-dialog";
import { AttendanceAllowedIpForm } from "@/features/attendance/components/attendance-allowed-ip-form";

export function AttendanceAllowedIpDialog({
  currentDetectedIp,
  trigger,
  showTrigger = true,
  open,
  onOpenChange,
}: {
  currentDetectedIp: string | null;
  trigger?: (controls: { openDialog: () => void }) => React.ReactNode;
  showTrigger?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [dialogInstance, setDialogInstance] = useState(0);
  const previousOpenRef = useRef(false);

  useEffect(() => {
    const isOpen = open ?? false;

    if (isOpen && !previousOpenRef.current) {
      setDialogInstance((currentValue) => currentValue + 1);
    }

    previousOpenRef.current = isOpen;
  }, [open]);

  const resolvedTrigger = showTrigger
    ? ({ openDialog }: { openDialog: () => void }) =>
        trigger ? (
          trigger({
            openDialog: () => {
              setDialogInstance((currentValue) => currentValue + 1);
              openDialog();
            },
          })
        ) : (
          <Button
            type="button"
            variant="add"
            onClick={() => {
              setDialogInstance((currentValue) => currentValue + 1);
              openDialog();
            }}
          >
            <Plus className="size-4" />
            Add IP
          </Button>
        )
    : undefined;

  return (
    <ModalDialog
      title="Add approved shop IP"
      description="Register a public internet address used to validate on-site mechanic punches."
      size="md"
      open={open}
      onOpenChange={onOpenChange}
      trigger={resolvedTrigger}
    >
      {({ closeDialog }) => (
        <AttendanceAllowedIpForm
          key={dialogInstance}
          currentDetectedIp={currentDetectedIp}
          closeDialog={closeDialog}
        />
      )}
    </ModalDialog>
  );
}
