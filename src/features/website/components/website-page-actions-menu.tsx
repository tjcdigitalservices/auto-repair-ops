"use client";

import { FilePlus2, Inbox, Settings2 } from "lucide-react";

import {
  TableRowActionsMenu,
  TableRowActionsMenuLink,
} from "@/components/shared/table-row-actions-menu";

export function WebsitePageActionsMenu() {
  return (
    <TableRowActionsMenu label="Website actions" variant="page">
      <TableRowActionsMenuLink
        href="/settings/website/journal/new"
        label="New Garage Journal Post"
        icon={FilePlus2}
      />
      <TableRowActionsMenuLink
        href="/quotations/website-requests"
        label="View Quote Requests"
        icon={Inbox}
      />
      <TableRowActionsMenuLink
        href="/settings?tab=presence"
        label="Website Settings"
        icon={Settings2}
      />
    </TableRowActionsMenu>
  );
}
