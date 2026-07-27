"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  QuickAccessSecondaryAction,
  QuickAccessWorkflowAction,
} from "@/features/quick-access/workflow";

export function QuickAccessWorkflowActions({
  primaryAction,
  secondaryActions,
  size = "sm",
}: {
  primaryAction: QuickAccessWorkflowAction;
  secondaryActions: QuickAccessSecondaryAction[];
  size?: "sm" | "default";
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild size={size} variant="bluePrimary">
        <Link href={primaryAction.href}>{primaryAction.label}</Link>
      </Button>
      {secondaryActions.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" size={size} variant="outline">
              <MoreHorizontal className="size-4" />
              More
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {secondaryActions.map((action) => (
              <DropdownMenuItem key={action.href} asChild>
                <Link href={action.href}>{action.label}</Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}
