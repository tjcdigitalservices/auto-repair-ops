"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { useActiveIntake } from "@/features/quick-access/intake/active-intake-provider";
import { markDailyArrivalIntakeStartedAction } from "@/features/quick-access/arrivals/arrival-queue-actions";
import { buildQuickAccessIntakeHref } from "@/features/quick-access/intake/active-intake-session";
import { formatQuickAccessWorkflowStatus } from "@/features/quick-access/intake/intake-workflow-status";
import type { QuickAccessCustomerRecord, QuickAccessPermissions } from "@/features/quick-access/types";
import {
  resolveQuickAccessPrimaryAction,
  type QuickAccessLinkedJobOrder,
} from "@/features/quick-access/workflow";

function resolvePrimaryForRecord(
  record: QuickAccessCustomerRecord,
  vehicleId: string,
  permissions: QuickAccessPermissions,
) {
  const jobOrdersByQuotationId = new Map<string, QuickAccessLinkedJobOrder>(
    Object.entries(record.linkedJobOrdersByQuotationId),
  );

  return resolveQuickAccessPrimaryAction({
    customerId: record.customer.id,
    vehicleId,
    recentQuotations: record.recentQuotations,
    jobOrdersByQuotationId,
    permissions,
  });
}

export function QuickAccessIntakeSync({
  records,
  permissions,
  activeVehicleId,
}: {
  records: QuickAccessCustomerRecord[];
  permissions: QuickAccessPermissions;
  activeVehicleId: string | null;
}) {
  const { startSession, updateWorkflow } = useActiveIntake();
  const lastSyncedKeyRef = useRef("");

  useEffect(() => {
    const record = records[0];

    if (!record || !activeVehicleId) {
      return;
    }

    const vehicle =
      record.vehicles.find((item) => item.id === activeVehicleId) ??
      record.vehicles.find((item) => item.id === record.highlightedVehicleId) ??
      null;

    if (!vehicle) {
      return;
    }

    const syncKey = `${record.customer.id}:${vehicle.id}`;
    const primaryAction = resolvePrimaryForRecord(record, vehicle.id, permissions);

    if (lastSyncedKeyRef.current !== syncKey) {
      lastSyncedKeyRef.current = syncKey;
      startSession({
        customerId: record.customer.id,
        vehicleId: vehicle.id,
        customerName: record.customer.displayName,
        vehicleLabel: `${vehicle.make} ${vehicle.model}`,
        plateNumber: vehicle.plateNumber ?? "",
        workflowState: primaryAction.state,
        workflowStatusLabel: formatQuickAccessWorkflowStatus(primaryAction.state),
      });
      void markDailyArrivalIntakeStartedAction(vehicle.id);
      return;
    }

    updateWorkflow(primaryAction);
  }, [activeVehicleId, permissions, records, startSession, updateWorkflow]);

  return null;
}

export function QuickAccessIntakeRestore({
  sessionCustomerId,
  sessionVehicleId,
  hasSearchResults,
}: {
  sessionCustomerId: string | null;
  sessionVehicleId: string | null;
  hasSearchResults: boolean;
}) {
  const router = useRouter();
  const { session } = useActiveIntake();

  useEffect(() => {
    if (hasSearchResults || sessionCustomerId || sessionVehicleId) {
      return;
    }

    if (!session) {
      return;
    }

    router.replace(buildQuickAccessIntakeHref(session.customerId, session.vehicleId));
  }, [hasSearchResults, router, session, sessionCustomerId, sessionVehicleId]);

  return null;
}
