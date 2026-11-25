"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateTenantStatusAction } from "@/features/platform/actions/platform-actions";
import type { PlatformTenantListItem } from "@/features/platform/types";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";
import type { TenantStatus } from "@/lib/tenants/status";

export function TenantRowActions({ tenant }: { tenant: PlatformTenantListItem }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setStatus(status: TenantStatus) {
    const formData = new FormData();
    formData.set("tenantId", tenant.id);
    formData.set("status", status);

    startTransition(async () => {
      await updateTenantStatusAction(INITIAL_FORM_ACTION_STATE, formData);
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-slate-500"
          aria-label={`Actions for ${tenant.name}`}
          disabled={pending}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={`/platform/tenants/${tenant.id}`}>View details</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/platform/tenants/${tenant.id}#subscription`}>
            Manage subscription
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/t/${tenant.slug}`} target="_blank" rel="noreferrer">
            Open shop site
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {tenant.status !== "active" ? (
          <DropdownMenuItem disabled={pending} onSelect={() => setStatus("active")}>
            Activate tenant
          </DropdownMenuItem>
        ) : null}
        {tenant.status !== "suspended" ? (
          <DropdownMenuItem
            disabled={pending}
            className="text-destructive focus:text-destructive"
            onSelect={() => setStatus("suspended")}
          >
            Suspend tenant
          </DropdownMenuItem>
        ) : null}
        {tenant.status === "suspended" ? (
          <DropdownMenuItem disabled={pending} onSelect={() => setStatus("trial")}>
            Return to trial
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
