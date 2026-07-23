"use client";

import { Archive, Copy, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  TableRowActionsMenu,
  TableRowActionsMenuButton,
  TableRowActionsMenuLink,
} from "@/components/shared/table-row-actions-menu";
import {
  archiveDocumentAction,
  deleteDocumentAction,
  duplicateDocumentAction,
} from "@/features/documents/actions/document-actions";

export function DocumentRowActions({
  documentId,
  documentTitle,
}: {
  documentId: string;
  documentTitle: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <TableRowActionsMenu label={`Open row actions for ${documentTitle}`}>
      <TableRowActionsMenuLink
        href={`/documents/${documentId}`}
        label="Open"
        icon={Pencil}
      />
      <TableRowActionsMenuButton
        label="Duplicate"
        icon={Copy}
        disabled={isPending}
        onSelect={() =>
          startTransition(async () => {
            const result = await duplicateDocumentAction(documentId);

            if (result.ok) {
              router.push(`/documents/${result.document.id}`);
              router.refresh();
            }
          })
        }
      />
      <TableRowActionsMenuButton
        label="Archive"
        icon={Archive}
        disabled={isPending}
        onSelect={() =>
          startTransition(async () => {
            const result = await archiveDocumentAction(documentId);

            if (result.ok) {
              router.refresh();
            }
          })
        }
      />
      <TableRowActionsMenuButton
        label="Delete"
        icon={Trash2}
        disabled={isPending}
        onSelect={() => startTransition(() => {
          void deleteDocumentAction(documentId);
        })}
      />
    </TableRowActionsMenu>
  );
}
