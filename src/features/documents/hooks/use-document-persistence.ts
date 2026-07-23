"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { JSONContent } from "@tiptap/core";

import type {
  DocumentRecord,
  DocumentSaveStatus,
  DocumentStatus,
} from "@/components/document-engine/persistence/types";
import { saveDocumentAction } from "@/features/documents/actions/document-actions";
import type { DocumentTemplateName } from "@/components/document-engine/templates/types";

const AUTOSAVE_DEBOUNCE_MS = 1500;

type UseDocumentPersistenceOptions = {
  documentId?: string;
  initialUpdatedAt?: string;
  title: string;
  template: DocumentTemplateName;
  contentJson: JSONContent;
  status: DocumentStatus;
  defaultTitle: string;
  onDocumentSaved?: (document: DocumentRecord) => void;
};

function buildSnapshot({
  title,
  contentJson,
  status,
  defaultTitle,
}: {
  title: string;
  contentJson: JSONContent;
  status: DocumentStatus;
  defaultTitle: string;
}) {
  const normalizedTitle = title.trim() || defaultTitle;

  return JSON.stringify({
    title: normalizedTitle,
    contentJson,
    status,
  });
}

export function useDocumentPersistence({
  documentId,
  initialUpdatedAt,
  title,
  template,
  contentJson,
  status,
  defaultTitle,
  onDocumentSaved,
}: UseDocumentPersistenceOptions) {
  const [saveStatus, setSaveStatus] = useState<DocumentSaveStatus>(() =>
    documentId
      ? { state: "saved", savedAt: initialUpdatedAt ?? new Date().toISOString() }
      : { state: "idle" },
  );
  const lastSavedSnapshot = useRef(
    buildSnapshot({ title, contentJson, status, defaultTitle }),
  );
  const saveInFlight = useRef(false);
  const queuedSave = useRef<{
    title: string;
    contentJson: JSONContent;
    status: DocumentStatus;
  } | null>(null);

  const persist = useCallback(
    async ({
      nextTitle,
      nextContentJson,
      nextStatus,
      nextDocumentId,
    }: {
      nextTitle: string;
      nextContentJson: JSONContent;
      nextStatus: DocumentStatus;
      nextDocumentId?: string;
    }) => {
      const snapshot = buildSnapshot({
        title: nextTitle,
        contentJson: nextContentJson,
        status: nextStatus,
        defaultTitle,
      });

      if (snapshot === lastSavedSnapshot.current) {
        return { ok: true as const, skipped: true };
      }

      if (saveInFlight.current) {
        queuedSave.current = {
          title: nextTitle,
          contentJson: nextContentJson,
          status: nextStatus,
        };
        return { ok: true as const, skipped: true };
      }

      saveInFlight.current = true;
      setSaveStatus({ state: "saving" });

      const result = await saveDocumentAction({
        id: nextDocumentId,
        title: nextTitle.trim() || defaultTitle,
        template,
        contentJson: nextContentJson,
        status: nextStatus,
      });

      saveInFlight.current = false;

      if (!result.ok) {
        setSaveStatus({ state: "error", message: result.message });
        return result;
      }

      lastSavedSnapshot.current = snapshot;
      setSaveStatus({ state: "saved", savedAt: result.document.updatedAt });
      onDocumentSaved?.(result.document);

      const queued = queuedSave.current;
      queuedSave.current = null;

      if (queued) {
        await persist({
          nextTitle: queued.title,
          nextContentJson: queued.contentJson,
          nextStatus: queued.status,
          nextDocumentId: result.document.id,
        });
      }

      return result;
    },
    [defaultTitle, onDocumentSaved, template],
  );

  useEffect(() => {
    const snapshot = buildSnapshot({ title, contentJson, status, defaultTitle });

    if (snapshot === lastSavedSnapshot.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      void persist({
        nextTitle: title,
        nextContentJson: contentJson,
        nextStatus: status,
        nextDocumentId: documentId,
      });
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [contentJson, defaultTitle, documentId, persist, status, title]);

  const saveNow = useCallback(async () => {
    return persist({
      nextTitle: title,
      nextContentJson: contentJson,
      nextStatus: status,
      nextDocumentId: documentId,
    });
  }, [contentJson, documentId, persist, status, title]);

  const saveAsDraft = useCallback(async () => {
    return persist({
      nextTitle: title,
      nextContentJson: contentJson,
      nextStatus: "draft",
      nextDocumentId: documentId,
    });
  }, [contentJson, documentId, persist, title]);

  const publish = useCallback(async () => {
    return persist({
      nextTitle: title,
      nextContentJson: contentJson,
      nextStatus: "published",
      nextDocumentId: documentId,
    });
  }, [contentJson, documentId, persist, title]);

  return {
    saveStatus,
    saveNow,
    saveAsDraft,
    publish,
  };
}
