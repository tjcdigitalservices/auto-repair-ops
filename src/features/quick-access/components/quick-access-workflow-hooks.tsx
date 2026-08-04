"use client";

import { useMemo } from "react";

import type {
  QuickAccessCustomerRecord,
  QuickAccessPermissions,
} from "@/features/quick-access/types";
import {
  resolveQuickAccessPrimaryAction,
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
    const primaryAction = resolveQuickAccessPrimaryAction({
      customerId: params.record.customer.id,
      vehicleId: params.activeVehicleId,
      recentQuotations: params.record.recentQuotations,
      jobOrdersByQuotationId,
      permissions: params.permissions,
    });

    return { primaryAction };
  }, [
    params.activeVehicleId,
    params.permissions,
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
  const { primaryAction } = useQuickAccessWorkflowActions(props);

  return <QuickAccessWorkflowActions primaryAction={primaryAction} size={props.size} />;
}
