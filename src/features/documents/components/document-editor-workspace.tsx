"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import type { JSONContent } from "@tiptap/core";

import { DocumentComposer } from "@/components/document-engine";
import { normalizeDocumentJson } from "@/components/document-engine/persistence/document-content";
import type { DocumentRecord } from "@/components/document-engine/persistence/types";
import { getDocumentTemplate } from "@/components/document-engine/templates/registry";
import type {
  DocumentBusinessProfile,
  DocumentTemplateName,
} from "@/components/document-engine/types";
import { DocumentComposerHeaderActions } from "@/features/documents/components/document-composer-header-actions";
import { useDocumentPersistence } from "@/features/documents/hooks/use-document-persistence";

export function DocumentEditorWorkspace({
  businessProfile,
  branchName,
  document,
  template = "blank",
}: {
  businessProfile: DocumentBusinessProfile;
  branchName: string;
  document?: DocumentRecord;
  template?: DocumentTemplateName;
}) {
  const router = useRouter();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const resolvedTemplate = (document?.template as DocumentTemplateName | undefined) ?? template;
  const documentTemplate = getDocumentTemplate(resolvedTemplate);
  const [documentId, setDocumentId] = useState(document?.id);
  const [title, setTitle] = useState(document?.title ?? "");
  const [contentJson, setContentJson] = useState<JSONContent>(() =>
    normalizeDocumentJson(document?.contentJson ?? documentTemplate.defaultContentJson),
  );
  const [status, setStatus] = useState(document?.status ?? "draft");

  const resolvedDocument = useMemo<DocumentRecord | undefined>(() => {
    if (!documentId) {
      return undefined;
    }

    return {
      id: documentId,
      title: title.trim() || documentTemplate.defaultDocumentTitle,
      template: resolvedTemplate,
      contentJson,
      status,
      createdBy: document?.createdBy ?? null,
      createdAt: document?.createdAt ?? new Date().toISOString(),
      updatedAt: document?.updatedAt ?? new Date().toISOString(),
      rootDocumentId: document?.rootDocumentId ?? documentId,
      parentDocumentId: document?.parentDocumentId ?? null,
      revisionNumber: document?.revisionNumber ?? 0,
      isCurrentRevision: document?.isCurrentRevision ?? true,
      publishedAt: document?.publishedAt ?? null,
    };
  }, [
    contentJson,
    document?.createdAt,
    document?.createdBy,
    document?.isCurrentRevision,
    document?.parentDocumentId,
    document?.publishedAt,
    document?.revisionNumber,
    document?.rootDocumentId,
    document?.updatedAt,
    documentId,
    documentTemplate.defaultDocumentTitle,
    resolvedTemplate,
    status,
    title,
  ]);

  const handleDocumentSaved = useCallback(
    (saved: DocumentRecord) => {
      setDocumentId(saved.id);
      setStatus(saved.status);

      if (!document?.id) {
        router.replace(`/documents/${saved.id}`);
      }
    },
    [document?.id, router],
  );

  const { saveStatus, publish } = useDocumentPersistence({
    documentId,
    initialUpdatedAt: document?.updatedAt,
    title,
    template: resolvedTemplate,
    contentJson,
    status,
    defaultTitle: documentTemplate.defaultDocumentTitle,
    onDocumentSaved: handleDocumentSaved,
  });

  async function handlePublish() {
    setStatus("published");
    await publish();
  }

  function handleRename() {
    titleInputRef.current?.focus();
    titleInputRef.current?.select();
  }

  return (
    <DocumentComposer
      template={resolvedTemplate}
      document={resolvedDocument}
      moduleTitle={documentId ? "Edit Document" : "New Document"}
      moduleDescription={`Compose and print A4 documents for ${branchName}.`}
      documentTitle={title}
      onDocumentTitleChange={setTitle}
      titleInputRef={titleInputRef}
      defaultDocumentTitle={documentTemplate.defaultDocumentTitle}
      businessProfile={businessProfile}
      onContentJsonChange={setContentJson}
      saveStatus={saveStatus}
      headerActions={
        <DocumentComposerHeaderActions
          documentId={documentId}
          status={status}
          revisionNumber={document?.revisionNumber}
          isCurrentRevision={document?.isCurrentRevision}
          onPublish={() => void handlePublish()}
          onPrint={() => window.print()}
          onRename={handleRename}
        />
      }
    />
  );
}
