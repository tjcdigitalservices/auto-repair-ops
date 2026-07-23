import { notFound } from "next/navigation";

import { isDocumentTemplateName } from "@/components/document-engine/templates/registry";
import { DocumentEditorWorkspace } from "@/features/documents/components/document-editor-workspace";
import { NewDocumentTemplatePicker } from "@/features/documents/components/new-document-template-picker";
import { getDocumentEditorPageData } from "@/features/documents/queries/document-queries";
import { requireStaffCapability } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type NewDocumentPageProps = {
  searchParams: Promise<{
    template?: string;
  }>;
};

export default async function NewDocumentPage({ searchParams }: NewDocumentPageProps) {
  await requireStaffCapability("documents:write");
  const { template } = await searchParams;

  if (!template) {
    return <NewDocumentTemplatePicker />;
  }

  if (!isDocumentTemplateName(template)) {
    notFound();
  }

  const pageData = await getDocumentEditorPageData();

  return (
    <DocumentEditorWorkspace
      businessProfile={pageData.businessProfile}
      branchName={pageData.branchName}
      template={template}
    />
  );
}
