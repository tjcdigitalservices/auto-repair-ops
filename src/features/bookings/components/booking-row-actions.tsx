"use client";

import { useTransition } from "react";

import {
  checkInBookingAction,
  confirmBookingAction,
  updateBookingStatusAction,
} from "@/features/bookings/actions/booking-actions";
import type { BookingListItem } from "@/features/bookings/types";
import {
  TableRowActionsMenu,
  TableRowActionsMenuButton,
} from "@/components/shared/table-row-actions-menu";
import {
  checkInSandboxBookingRecord,
  confirmSandboxBookingRecord,
  updateSandboxBookingStatusRecord,
} from "@/features/sandbox/records";
import { readSandboxShop, updateSandboxShop } from "@/features/sandbox/store";
import { useSandboxOptional } from "@/features/sandbox/use-bound-action";

export function BookingRowActions({ booking }: { booking: BookingListItem }) {
  const sandbox = useSandboxOptional();
  const [isPending, startTransition] = useTransition();

  function runAction(action: () => Promise<{ ok: boolean; message?: string }>) {
    startTransition(async () => {
      const result = await action();

      if (!result.ok && result.message) {
        window.alert(result.message);
      }
    });
  }

  async function applySandboxMutation(
    mutate: (shop: NonNullable<ReturnType<typeof readSandboxShop>>) => ReturnType<typeof confirmSandboxBookingRecord>,
  ) {
    const shop = readSandboxShop();

    if (!shop) {
      return { ok: false, message: "Sample shop is not ready." };
    }

    const result = mutate(shop);

    if (!result.ok) {
      return result;
    }

    await updateSandboxShop(() => result.snapshot);
    return { ok: true };
  }

  if (booking.status === "checked_in" || booking.status === "cancelled") {
    return null;
  }

  return (
    <TableRowActionsMenu label="Booking actions" variant="row">
      {booking.status === "requested" ? (
        <TableRowActionsMenuButton
          label="Confirm"
          onSelect={() =>
            runAction(() =>
              sandbox
                ? applySandboxMutation((shop) => confirmSandboxBookingRecord(shop, booking.id))
                : confirmBookingAction(booking.id),
            )
          }
          disabled={isPending}
        />
      ) : null}
      {booking.status === "requested" || booking.status === "confirmed" ? (
        <TableRowActionsMenuButton
          label="Check in"
          onSelect={() =>
            runAction(() =>
              sandbox
                ? applySandboxMutation((shop) => checkInSandboxBookingRecord(shop, booking.id))
                : checkInBookingAction(booking.id),
            )
          }
          disabled={isPending}
        />
      ) : null}
      {booking.status === "requested" || booking.status === "confirmed" ? (
        <>
          <TableRowActionsMenuButton
            label="Mark no-show"
            onSelect={() =>
              runAction(() =>
                sandbox
                  ? applySandboxMutation((shop) =>
                      updateSandboxBookingStatusRecord(shop, booking.id, "no_show"),
                    )
                  : updateBookingStatusAction(booking.id, "no_show"),
              )
            }
            disabled={isPending}
          />
          <TableRowActionsMenuButton
            label="Cancel"
            onSelect={() =>
              runAction(() =>
                sandbox
                  ? applySandboxMutation((shop) =>
                      updateSandboxBookingStatusRecord(shop, booking.id, "cancelled"),
                    )
                  : updateBookingStatusAction(booking.id, "cancelled"),
              )
            }
            disabled={isPending}
          />
        </>
      ) : null}
    </TableRowActionsMenu>
  );
}
