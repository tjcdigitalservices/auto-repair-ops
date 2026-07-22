import Link from "next/link";

import { BranchSelector } from "@/components/shared/branch-selector";
import { DataTableCard } from "@/components/shared/data-table-card";
import { DataTableFilters } from "@/components/shared/data-table-filters";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { TableCellLink } from "@/components/shared/table-cell-link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InvoiceRowActions } from "@/features/invoices/components/invoice-row-actions";
import { InvoiceStatusBadge } from "@/features/invoices/components/invoice-status-badge";
import { listInvoices } from "@/features/invoices/queries/invoice-queries";
import { getBranchScope, getPageBranchSelectorProps } from "@/lib/branches";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/dates";
import { paginateItems } from "@/lib/pagination";

export const dynamic = "force-dynamic";

type InvoicesPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: "unpaid" | "partially_paid" | "paid" | "cancelled";
    page?: string;
  }>;
};

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const [{ search = "", status = "", page }, branchSelector] = await Promise.all([
    searchParams,
    getBranchScope().then(getPageBranchSelectorProps),
  ]);
  const invoices = await listInvoices({ search, status });
  const pagination = paginateItems(invoices, page);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Billing documents and outstanding balances."
      />

      <DataTableCard
        toolbar={
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <BranchSelector {...branchSelector} className="w-full lg:w-[12rem]" />
            <DataTableFilters
              key={`${search}:${status}`}
              className="min-w-0 flex-1 lg:grid lg:grid-cols-[minmax(0,1fr)_220px]"
              search={{
                value: search,
                placeholder: "Search invoice number",
              }}
              filters={[
                {
                  type: "select",
                  name: "status",
                  value: status,
                  options: [
                    { value: "", label: "All statuses" },
                    { value: "unpaid", label: "Unpaid" },
                    { value: "partially_paid", label: "Partially paid" },
                    { value: "paid", label: "Paid" },
                    { value: "cancelled", label: "Cancelled" },
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
            title="No invoices found"
            description="Invoices are created from completed job orders or POS sales."
            action={
              <Button asChild>
                <Link href="/job-orders">Go to job orders</Link>
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Job order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.items.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <TableCellLink href={`/invoices/${invoice.id}`} className="font-medium text-foreground">
                        {invoice.invoiceNumber}
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/invoices/${invoice.id}`} className="text-foreground">
                        {invoice.jobOrderNumber ?? "POS flow"}
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/invoices/${invoice.id}`} className="text-foreground">
                        {invoice.customerName}
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/invoices/${invoice.id}`} className="text-foreground">
                        {invoice.vehicleLabel}
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/invoices/${invoice.id}`}>
                        <InvoiceStatusBadge status={invoice.status} variant="table" />
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/invoices/${invoice.id}`} className="text-foreground">
                        {formatCurrency(invoice.totalAmount)}
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/invoices/${invoice.id}`} className="text-foreground">
                        {formatCurrency(invoice.balance)}
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/invoices/${invoice.id}`} className="text-foreground">
                        {formatDate(invoice.invoiceDate)}
                      </TableCellLink>
                    </TableCell>
                    <TableCell className="text-right">
                      <InvoiceRowActions
                        invoiceId={invoice.id}
                        invoiceNumber={invoice.invoiceNumber}
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
