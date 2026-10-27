"use client";

import { Archive, Copy, Pencil, Printer, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import type { DocumentStatus } from "@/components/document-engine/persistence/types";
import {
  ReviseApprovedDocumentDialog,
  canReviseApprovedDocument,
} from "@/components/document-engine/revisions";
import { PageHeaderActions } from "@/components/shared/page-header-actions";
import {
  TableRowActionsMenu,
  TableRowActionsMenuButton,
  TableRowActionsMenuSeparator,
} from "@/components/shared/table-row-actions-menu";
import {
  archiveDocumentAction,
  deleteDocumentAction,
  duplicateDocumentAction,
  reviseDocumentFormAction,
} from "@/features/documents/actions/document-actions";
import {
  archiveSandboxDocumentAction,
  deleteSandboxDocumentAction,
  duplicateSandboxDocumentAction,
  reviseSandboxDocumentFormAction,
} from "@/features/sandbox/form-actions";
import { useBoundFormAction, useSandboxOptional } from "@/features/sandbox/use-bound-action";
import { Button } from "@/components/ui/button";

export function DocumentComposerHeaderActions({
  documentId,
  status,
  onPublish,
  onPrint,
  onRename,
}: {
  documentId?: string;
  status: DocumentStatus;
  onPublish: () => void;
  onPrint: () => void;
  onRename: () => void;
}) {
  const router = useRouter();
  const sandbox = useSandboxOptional();
  const reviseAction = useBoundFormAction(reviseDocumentFormAction, reviseSandboxDocumentFormAction);
  const [isPending, startTransition] = useTransition();
  const isDraft = status === "draft";
  const canRevise = canReviseApprovedDocument(status);

  return (
    <PageHeaderActions
      primary={
        isDraft ? (
          <Button type="button" onClick={onPublish}>
            Publish
          </Button>
        ) : canRevise && documentId ? (
          <ReviseApprovedDocumentDialog
            title="Revise Published Document"
            description="Creating a revision will preserve the current published document and create a new editable draft linked to it."
            action={reviseAction}
            fields={[{ name: "documentId", value: documentId }]}
            triggerLabel="Revise"
            confirmLabel="Create Revision"
            cancelLabel="Cancel"
          />
        ) : null
      }
      overflow={
        <TableRowActionsMenu label="Document actions" variant="page">
          <TableRowActionsMenuButton label="Print" icon={Printer} onSelect={onPrint} />
          <TableRowActionsMenuButton label="Rename" icon={Pencil} onSelect={onRename} />
          {documentId ? (
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
          ) : null}

          {documentId ? (
            <>
              <TableRowActionsMenuSeparator />

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
                      router.push("/documents");
                      router.refresh();
                    }
                  })
                }
              />

              <TableRowActionsMenuSeparator />

              <TableRowActionsMenuButton
                label="Delete"
                icon={Trash2}
                disabled={isPending}
                onSelect={() =>
                  startTransition(() => {
                    void (sandbox ? deleteSandboxDocumentAction(documentId) : deleteDocumentAction(documentId));
                  })
                }
              />
            </>
          ) : null}
        </TableRowActionsMenu>
      }
    />
  );
}
