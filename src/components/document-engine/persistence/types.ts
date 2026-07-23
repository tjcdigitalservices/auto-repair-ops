export type DocumentStatus = "draft" | "published" | "archived";

export type DocumentRecord = {
  id: string;
  title: string;
  template: string;
  contentJson: unknown;
  status: DocumentStatus;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  rootDocumentId: string | null;
  parentDocumentId: string | null;
  revisionNumber: number;
  isCurrentRevision: boolean;
  publishedAt: string | null;
};

export type DocumentListItem = Pick<
  DocumentRecord,
  "id" | "title" | "template" | "status" | "updatedAt"
>;

export type DocumentSaveStatus =
  | { state: "idle" }
  | { state: "saving" }
  | { state: "saved"; savedAt: string }
  | { state: "error"; message: string };

export type SaveDocumentInput = {
  id?: string;
  title: string;
  template: string;
  contentJson: unknown;
  status: DocumentStatus;
};

export type SaveDocumentResult =
  | { ok: true; document: DocumentRecord }
  | { ok: false; message: string };
