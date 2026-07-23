import type { DocumentRecord, DocumentStatus } from "@/components/document-engine/persistence/types";
import type { DocumentListItem } from "@/components/document-engine/persistence/types";
import type { TableRow } from "@/types/database";

type DocumentRow = TableRow<"documents">;

export function mapDocumentRowToRecord(row: DocumentRow): DocumentRecord {
  return {
    id: row.id,
    title: row.title,
    template: row.template,
    contentJson: row.content_json,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    rootDocumentId: row.root_document_id,
    parentDocumentId: row.parent_document_id,
    revisionNumber: row.revision_number,
    isCurrentRevision: row.is_current_revision,
    publishedAt: row.published_at,
  };
}

export function mapDocumentRowToListItem(row: DocumentRow): DocumentListItem {
  return {
    id: row.id,
    title: row.title,
    template: row.template,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

export function buildDuplicateDocumentTitle(title: string) {
  const trimmed = title.trim();
  const copyPrefix = "Copy of ";

  if (trimmed.toLowerCase().startsWith(copyPrefix.toLowerCase())) {
    return trimmed;
  }

  return `${copyPrefix}${trimmed}`;
}

export function normalizeDocumentTitle(title: string, fallbackTitle: string) {
  const trimmed = title.trim();
  return trimmed || fallbackTitle;
}

export function isDocumentStatus(value: string): value is DocumentStatus {
  return value === "draft" || value === "published" || value === "archived";
}
