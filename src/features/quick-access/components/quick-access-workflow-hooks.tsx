"use client";

import { useMemo } from "react";

import type {
  QuickAccessCustomerRecord,
  QuickAccessPermissions,
} from "@/features/quick-access/types";
import {
  buildQuickAccessSecondaryActionsWithIntakeContext,
  resolveQuickAccessPrimaryActionWithIntakeContext,
  type QuickAccessLinkedJobOrder,
} from "@/features/quick-access/workflow";
import { QuickAccessWorkflowActions } from "@/features/quick-access/components/quick-access-workflow-actions";

export function useQuickAccessWorkflowActions(params: {
  record: QuickAccessCustomerRecord;
  activeVehicleId: string | null;
  permissions: QuickAccessPermissions;
}) {
  return useMemo(() => {
    const jobOrdersByQuotationId = new Map<string, QuickAccessLinkedJobOrder>(
      Object.entries(params.record.linkedJobOrdersByQuotationId),
    );
    const primaryAction = resolveQuickAccessPrimaryActionWithIntakeContext({
      customerId: params.record.customer.id,
      vehicleId: params.activeVehicleId,
      recentQuotations: params.record.recentQuotations,
      jobOrdersByQuotationId,
      permissions: params.permissions,
    });
    const secondaryActions = buildQuickAccessSecondaryActionsWithIntakeContext({
      customerId: params.record.customer.id,
      customerDisplayName: params.record.customer.displayName,
      vehicleId: params.activeVehicleId,
      permissions: params.permissions,
    });

    return { primaryAction, secondaryActions };
  }, [
    params.activeVehicleId,
    params.permissions,
    params.record.customer.displayName,
    params.record.customer.id,
    params.record.linkedJobOrdersByQuotationId,
    params.record.recentQuotations,
  ]);
}

export function QuickAccessRecordWorkflowActions(props: {
  record: QuickAccessCustomerRecord;
  activeVehicleId: string | null;
  permissions: QuickAccessPermissions;
  size?: "sm" | "default";
}) {
  const { primaryAction, secondaryActions } = useQuickAccessWorkflowActions(props);

  return (
    <QuickAccessWorkflowActions
      primaryAction={primaryAction}
      secondaryActions={secondaryActions}
      size={props.size}
    />
  );
}
