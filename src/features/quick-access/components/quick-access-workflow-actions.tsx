"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import type {
  QuickAccessWorkflowAction,
} from "@/features/quick-access/workflow";

export function QuickAccessWorkflowActions({
  primaryAction,
  size = "sm",
}: {
  primaryAction: QuickAccessWorkflowAction;
  secondaryActions?: never;
  size?: "sm" | "default";
}) {
  return (
    <Button asChild size={size} variant="bluePrimary">
      <Link href={primaryAction.href}>{primaryAction.label}</Link>
    </Button>
  );
}
