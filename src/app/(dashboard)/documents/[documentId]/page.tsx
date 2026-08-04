import { notFound } from "next/navigation";

import { DocumentEditorWorkspace } from "@/features/documents/components/document-editor-workspace";
import {
  getDocumentById,
  getDocumentEditorPageData,
} from "@/features/documents/queries/document-queries";
import { requireStaffCapability } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type DocumentDetailPageProps = {
  params: Promise<{
    documentId: string;
  }>;
};

export default async function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  await requireStaffCapability("documents:write");
  const { documentId } = await params;
  const [document, pageData] = await Promise.all([
    getDocumentById(documentId),
    getDocumentEditorPageData(),
  ]);

  if (!document) {
    notFound();
  }

  if (document.status === "archived") {
    notFound();
  }

  return (
    <DocumentEditorWorkspace
      businessProfile={pageData.businessProfile}
      branchName={pageData.branchName}
      showBranchContext={pageData.showBranchContext}
      document={document}
    />
  );
}
