import type {
  DocumentListItem,
  DocumentRecord,
  DocumentStatus,
} from "@/components/document-engine/persistence/types";
import type { DocumentBusinessProfile } from "@/components/document-engine/types";

export type { DocumentListItem, DocumentRecord, DocumentStatus };

export type DocumentEditorPageData = {
  branchName: string;
  showBranchContext: boolean;
  businessProfile: DocumentBusinessProfile;
};

export type DocumentListFilters = {
  search?: string;
  status?: DocumentStatus | "all";
};

export type DocumentTemplateOption = {
  id: string;
  label: string;
  href: string;
};
