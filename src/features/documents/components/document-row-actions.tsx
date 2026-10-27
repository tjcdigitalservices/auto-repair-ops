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
import {
  archiveSandboxDocumentAction,
  deleteSandboxDocumentAction,
  duplicateSandboxDocumentAction,
} from "@/features/sandbox/form-actions";
import { useSandboxOptional } from "@/features/sandbox/use-bound-action";

export function DocumentRowActions({
  documentId,
  documentTitle,
}: {
  documentId: string;
  documentTitle: string;
}) {
  const router = useRouter();
  const sandbox = useSandboxOptional();
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
            const result = sandbox
              ? await duplicateSandboxDocumentAction(documentId)
              : await duplicateDocumentAction(documentId);

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
            const result = sandbox
              ? await archiveSandboxDocumentAction(documentId)
              : await archiveDocumentAction(documentId);

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
          void (sandbox ? deleteSandboxDocumentAction(documentId) : deleteDocumentAction(documentId));
        })}
      />
    </TableRowActionsMenu>
  );
}
