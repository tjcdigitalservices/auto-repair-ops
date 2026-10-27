import { DocumentsPageView } from "@/features/documents/components/documents-page-view";
import { listDocuments } from "@/features/documents/queries/document-queries";
import { requireStaffCapability } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type DocumentsPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
};

export default async function DocumentsPage({ searchParams }: DocumentsPageProps) {
  await requireStaffCapability("documents:read");
  const { search = "", status = "all", page } = await searchParams;
  const documents = await listDocuments({
    search,
    status: status === "all" ? "all" : status === "draft" || status === "published" ? status : "all",
  });

  return <DocumentsPageView documents={documents} search={search} status={status} page={page} />;
}
