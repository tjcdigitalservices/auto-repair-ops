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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ServicePageActionsMenu } from "@/features/services/components/service-page-actions-menu";
import { ServiceRowActions } from "@/features/services/components/service-row-actions";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { listServices } from "@/features/services/queries/service-queries";
import { paginateItems } from "@/lib/pagination";

export const dynamic = "force-dynamic";

type ServicesPageProps = {
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
};

export default async function ServicesPage({
  searchParams,
}: ServicesPageProps) {
  const { search = "", page } = await searchParams;
  const services = await listServices(search);
  const pagination = paginateItems(services, page);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Services"
        description="Labor and service catalog used in quotations and job orders."
        actions={
          <PageHeaderActions
            primary={<PagePrimaryAction href="/services/new">New Service</PagePrimaryAction>}
            overflow={<ServicePageActionsMenu />}
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
              placeholder: "Search by service name or category",
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
            title="No services found"
            description="Add services to the catalog so they can be quoted and billed consistently."
            action={
              <Button asChild>
                <Link href="/services/new">Create service</Link>
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Labor price</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-14 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.items.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <DataTableCellStack>
                        <DataTablePrimaryText>{service.name}</DataTablePrimaryText>
                        <DataTableSecondaryText>
                          {service.description ?? "No description"}
                        </DataTableSecondaryText>
                      </DataTableCellStack>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {service.category ?? "Uncategorized"}
                    </TableCell>
                    <TableCell className="font-medium tabular-nums">
                      {formatCurrency(service.laborPrice)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {service.estimatedDurationMinutes
                        ? `${service.estimatedDurationMinutes} min`
                        : "Not set"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        tone={service.status === "active" ? "success" : "neutral"}
                        variant="table"
                      >
                        {service.status}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <ServiceRowActions
                        serviceId={service.id}
                        serviceName={service.name}
                        canManage={service.canManage}
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
