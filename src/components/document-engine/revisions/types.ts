export type DocumentRevisionMetadata = {
  rootDocumentId: string;
  parentDocumentId: string | null;
  revisionNumber: number;
  isCurrentRevision: boolean;
  publishedAt: string | null;
};

export type RevisionDisplayContext = {
  revisionNumber: number;
  isCurrentRevision: boolean;
};
