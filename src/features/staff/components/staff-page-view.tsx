import Link from "next/link";

import { DataTableCard } from "@/components/shared/data-table-card";
import { DataTableFilters } from "@/components/shared/data-table-filters";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { DataTablePrimaryText } from "@/components/shared/data-table-cells";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { PageHeaderActions, PagePrimaryAction } from "@/components/shared/page-header-actions";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StaffRowActions } from "@/features/staff/components/staff-row-actions";
import type { StaffListItem, StaffRole } from "@/features/staff/types";
import { paginateItems } from "@/lib/pagination";

export function StaffPageView({
  staff,
  search,
  role,
  page,
}: {
  staff: StaffListItem[];
  search: string;
  role: StaffRole | "";
  page?: string;
}) {
  const pagination = paginateItems(staff, page);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        description="Personnel records for attendance, payroll, and workshop assignments."
        actions={
          <PageHeaderActions
            primary={<PagePrimaryAction href="/staff/new">New Staff</PagePrimaryAction>}
          />
        }
      />

      <DataTableCard
        toolbar={
          <DataTableFilters
            key={`${search}:${role}`}
            className="lg:grid lg:grid-cols-[minmax(0,1fr)_220px]"
            search={{
              value: search,
              placeholder: "Search by staff name or contact number",
            }}
            filters={[
              {
                type: "select",
                name: "role",
                value: role,
                options: [
                  { value: "", label: "All roles" },
                  { value: "owner", label: "Owner" },
                  { value: "admin", label: "Admin" },
                  { value: "mechanic", label: "Mechanic" },
                  { value: "cashier", label: "Cashier" },
                  { value: "inventory_staff", label: "Inventory staff" },
                  { value: "service_advisor", label: "Service advisor" },
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
            title="No staff records found"
            description="Create the first staff record to enable attendance and payroll setup."
            action={
              <Button asChild>
                <Link href="/staff/new">Create staff record</Link>
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-14 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.items.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell className="font-mono text-xs font-medium tracking-[0.14em] text-muted-foreground">
                      {person.staffCode ?? "Pending"}
                    </TableCell>
                    <TableCell>
                      <DataTablePrimaryText>{person.fullName}</DataTablePrimaryText>
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">
                      {person.role.replace("_", " ")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {person.contactNumber ?? "No contact number"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        tone={person.status === "active" ? "success" : "neutral"}
                        variant="table"
                      >
                        {person.status}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <StaffRowActions staffId={person.id} staffName={person.fullName} />
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
