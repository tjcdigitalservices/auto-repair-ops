import Link from "next/link";

import { BranchSelector } from "@/components/shared/branch-selector";
import { DataTableCard } from "@/components/shared/data-table-card";
import { DataTableFilters } from "@/components/shared/data-table-filters";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { PageHeaderActions, PagePrimaryAction } from "@/components/shared/page-header-actions";
import { TableCellLink } from "@/components/shared/table-cell-link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QuotationPageActionsMenu } from "@/features/quotations/components/quotation-page-actions-menu";
import { QuotationRowActions } from "@/features/quotations/components/quotation-row-actions";
import { QuotationStatusBadge } from "@/features/quotations/components/quotation-status-badge";
import type { QuotationListItem, QuotationStatus } from "@/features/quotations/types";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/dates";
import { paginateItems } from "@/lib/pagination";

export function QuotationsPageView({
  quotations,
  search,
  status,
  page,
  branch,
}: {
  quotations: QuotationListItem[];
  search: string;
  status: "" | QuotationStatus | "pending";
  page?: string;
  branch: { id: string; name: string; code: string };
}) {
  const pagination = paginateItems(quotations, page);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotations"
        description="Estimates before operational approval and job-order execution."
        actions={
          <PageHeaderActions
            primary={<PagePrimaryAction href="/quotations/new">New Quotation</PagePrimaryAction>}
            overflow={<QuotationPageActionsMenu />}
          />
        }
      />

      <DataTableCard
        toolbar={
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <BranchSelector
              branches={[branch]}
              selectedBranchId={branch.id}
              canSwitch={false}
              className="w-full lg:w-[12rem]"
            />
            <DataTableFilters
              key={`${search}:${status}`}
              className="min-w-0 flex-1 lg:grid lg:grid-cols-[minmax(0,1fr)_220px]"
              search={{
                value: search,
                placeholder: "Search quotation number",
              }}
              filters={[
                {
                  type: "select",
                  name: "status",
                  value: status,
                  options: [
                    { value: "", label: "All statuses" },
                    { value: "pending", label: "Pending" },
                    { value: "draft", label: "Draft" },
                    { value: "pending_approval", label: "Pending approval" },
                    { value: "approved", label: "Approved" },
                    { value: "rejected", label: "Rejected" },
                    { value: "expired", label: "Expired" },
                  ],
                },
              ]}
            />
          </div>
        }
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
            title="No quotations found"
            description="Create a quotation now so approved estimates can move into job orders later."
            action={
              <Button asChild>
                <Link href="/quotations/new">Create quotation</Link>
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quotation</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.items.map((quotation) => (
                  <TableRow key={quotation.id}>
                    <TableCell>
                      <TableCellLink href={`/quotations/${quotation.id}`} className="font-medium text-foreground">
                        {quotation.quotationNumber}
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/quotations/${quotation.id}`} className="text-foreground">
                        {quotation.customerName}
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/quotations/${quotation.id}`} className="text-foreground">
                        {quotation.vehicleLabel}
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/quotations/${quotation.id}`}>
                        <QuotationStatusBadge status={quotation.status} variant="table" />
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/quotations/${quotation.id}`} className="text-foreground">
                        {formatCurrency(quotation.totalAmount)}
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/quotations/${quotation.id}`} className="text-foreground">
                        {formatDate(quotation.createdAt)}
                      </TableCellLink>
                    </TableCell>
                    <TableCell className="w-14 text-right">
                      <QuotationRowActions
                        quotationId={quotation.id}
                        quotationNumber={quotation.quotationNumber}
                        status={quotation.status}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DataTableCard>
    </div>
  );
}
