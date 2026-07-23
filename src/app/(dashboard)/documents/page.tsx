import Link from "next/link";

import { formatRelativeTime } from "@/lib/format-relative-time";

import { DataTableCard } from "@/components/shared/data-table-card";
import { DataTableFilters } from "@/components/shared/data-table-filters";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import {
  DataTableCellStack,
  DataTablePrimaryText,
  DataTableSecondaryText,
} from "@/components/shared/data-table-cells";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { PageHeaderActions, PagePrimaryAction } from "@/components/shared/page-header-actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { getDocumentTemplate, isDocumentTemplateName } from "@/components/document-engine/templates/registry";
import { DocumentRowActions } from "@/features/documents/components/document-row-actions";
import { DocumentStatusBadge } from "@/features/documents/components/document-status-badge";
import { requireStaffCapability } from "@/lib/auth/session";
import { listDocuments } from "@/features/documents/queries/document-queries";
import { paginateItems } from "@/lib/pagination";

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
  const pagination = paginateItems(documents, page);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Create, save, and manage reusable printable documents."
        actions={
          <PageHeaderActions
            primary={<PagePrimaryAction href="/documents/new">New Document</PagePrimaryAction>}
          />
        }
      />

      <DataTableCard
        toolbar={
          <DataTableFilters
            key={`${search}-${status}`}
            className="md:grid md:grid-cols-[minmax(0,1fr)_12rem]"
            search={{
              value: search,
              placeholder: "Search by title",
            }}
            filters={[
              {
                type: "select",
                name: "status",
                value: status,
                options: [
                  { value: "all", label: "All statuses" },
                  { value: "draft", label: "Draft" },
                  { value: "published", label: "Published" },
                ],
              },
            ]}
          />
        }
        contentClassName="p-0"
        footer={
          <DataTablePagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            totalPages={pagination.totalPages}
            startItem={pagination.startItem}
            endItem={pagination.endItem}
          />
        }
      >
        {pagination.totalItems === 0 ? (
          <EmptyState
            title="No documents found"
            description="Create your first document to start composing printable content."
            action={
              <Button asChild>
                <Link href="/documents/new">Create document</Link>
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-14 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.items.map((document) => {
                  const templateLabel = isDocumentTemplateName(document.template)
                    ? getDocumentTemplate(document.template).label
                    : document.template;

                  return (
                    <TableRow key={document.id}>
                      <TableCell>
                        <DataTableCellStack>
                          <DataTablePrimaryText>
                            <Link href={`/documents/${document.id}`} className="hover:underline">
                              {document.title}
                            </Link>
                          </DataTablePrimaryText>
                          <DataTableSecondaryText>{templateLabel}</DataTableSecondaryText>
                        </DataTableCellStack>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{templateLabel}</TableCell>
                      <TableCell>
                        <DocumentStatusBadge status={document.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatRelativeTime(document.updatedAt, { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DocumentRowActions
                          documentId={document.id}
                          documentTitle={document.title}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </DataTableCard>
    </div>
  );
}
