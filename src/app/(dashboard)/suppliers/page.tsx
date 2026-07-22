import Link from "next/link";

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
import { StatusBadge } from "@/components/shared/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SupplierRowActions } from "@/features/suppliers/components/supplier-row-actions";
import { listSuppliers } from "@/features/suppliers/queries/supplier-queries";
import { paginateItems } from "@/lib/pagination";

export const dynamic = "force-dynamic";

type SuppliersPageProps = {
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
};

export default async function SuppliersPage({ searchParams }: SuppliersPageProps) {
  const { search = "", page } = await searchParams;
  const suppliers = await listSuppliers(search);
  const pagination = paginateItems(suppliers, page);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description="Supplier directory for product sourcing and procurement."
        actions={
          <PageHeaderActions
            primary={<PagePrimaryAction href="/suppliers/new">New Supplier</PagePrimaryAction>}
          />
        }
      />

      <DataTableCard
        toolbar={
          <DataTableFilters
            key={search}
            className="md:grid md:grid-cols-[minmax(0,1fr)]"
            search={{
              value: search,
              placeholder: "Search by supplier, contact person, or contact number",
            }}
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
            title="No suppliers found"
            description="Add your first supplier so product records can reference sourcing details."
            action={
              <Button asChild>
                <Link href="/suppliers/new">Create supplier</Link>
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Payment terms</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-14 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.items.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <DataTableCellStack>
                        <DataTablePrimaryText>{supplier.supplierName}</DataTablePrimaryText>
                        <DataTableSecondaryText>{supplier.email ?? "No email"}</DataTableSecondaryText>
                      </DataTableCellStack>
                    </TableCell>
                    <TableCell>
                      <DataTableCellStack>
                        <DataTablePrimaryText>
                          {supplier.contactPerson ?? "No contact person"}
                        </DataTablePrimaryText>
                        <DataTableSecondaryText>
                          {supplier.contactNumber ?? "No contact number"}
                        </DataTableSecondaryText>
                      </DataTableCellStack>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {supplier.paymentTerms ?? "Not set"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        tone={supplier.status === "active" ? "success" : "neutral"}
                        variant="table"
                      >
                        {supplier.status}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <SupplierRowActions
                        supplierId={supplier.id}
                        supplierName={supplier.supplierName}
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
