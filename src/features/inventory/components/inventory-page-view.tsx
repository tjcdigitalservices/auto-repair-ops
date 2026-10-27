import { DataTableCard } from "@/components/shared/data-table-card";
import {
  DataTableCellStack,
  DataTablePrimaryText,
  DataTableSecondaryText,
  formatDataTableMetaLine,
} from "@/components/shared/data-table-cells";
import { BranchSelector } from "@/components/shared/branch-selector";
import { DataTableFilters } from "@/components/shared/data-table-filters";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { PageHeaderActions } from "@/components/shared/page-header-actions";
import { PageTabToolbar } from "@/components/shared/page-tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InventoryMovementDialog } from "@/features/inventory/components/inventory-movement-dialog";
import { InventoryPageActionsMenu } from "@/features/inventory/components/inventory-page-actions-menu";
import { InventoryStockRowActions } from "@/features/inventory/components/inventory-stock-row-actions";
import { InventorySummaryStrip } from "@/features/inventory/components/inventory-summary-strip";
import { InventoryTabNav } from "@/features/inventory/components/inventory-tab-nav";
import {
  InventoryMovementTypeBadge,
  InventoryStockStatusBadge,
} from "@/features/inventory/components/inventory-status-badge";
import { INVENTORY_STOCK_STATE_OPTIONS } from "@/features/inventory/constants";
import type {
  InventoryDashboardData,
  InventoryMovementType,
  InventoryStockFilterState,
} from "@/features/inventory/types";
import type { ProductFormOptionsData } from "@/features/products/types";
import {
  formatInventoryMovementType,
  formatInventoryQuantity,
} from "@/features/inventory/utils";
import { formatCurrency } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";
import { paginateItems } from "@/lib/pagination";
import { cn } from "@/lib/utils";

export function InventoryPageView({
  inventory,
  search = "",
  stockState = "all",
  movementType = "",
  activeTab,
  stockPage,
  movementPage,
  pageSize,
  productFormOptions = null,
}: {
  inventory: InventoryDashboardData;
  search?: string;
  stockState?: InventoryStockFilterState;
  movementType?: InventoryMovementType | "";
  activeTab: "inventory" | "movements";
  stockPage?: string;
  movementPage?: string;
  pageSize?: string;
  productFormOptions?: ProductFormOptionsData | null;
}) {
  const stockPagination = paginateItems(inventory.stocks, stockPage, pageSize);
  const movementPagination = paginateItems(inventory.movements, movementPage, pageSize);
  const activePagination = activeTab === "movements" ? movementPagination : stockPagination;
  const activePageParamName = activeTab === "movements" ? "movementPage" : "stockPage";

  return (
    <div className="space-y-0">
      <PageHeader
        title="Inventory"
        description="Branch stock balances and movement history."
        actions={
          <PageHeaderActions
            primary={
              <InventoryMovementDialog
                products={inventory.productOptions}
                canCreateProducts={inventory.permissions.canCreateProducts}
                productFormOptions={productFormOptions}
              />
            }
            overflow={<InventoryPageActionsMenu products={inventory.productOptions} />}
          />
        }
      />

      <InventoryTabNav
        stockCount={inventory.stocks.length}
        movementCount={inventory.movements.length}
      />

      <div className="space-y-3 pt-4">
        {activeTab === "inventory" ? (
          <InventorySummaryStrip summary={inventory.summary} stockState={stockState} />
        ) : null}

        <DataTableCard
          contentClassName="p-0"
          toolbar={
            <PageTabToolbar>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                <BranchSelector
                  branches={inventory.branches}
                  selectedBranchId={inventory.selectedBranchId}
                  canSwitch={inventory.canSwitch}
                  className="w-full lg:w-[12rem]"
                />
                <DataTableFilters
                  key={`${activeTab}:${search}:${stockState}:${movementType}`}
                  className={cn(
                    "min-w-0 flex-1",
                    activeTab === "inventory"
                      ? "lg:grid lg:grid-cols-[minmax(0,1fr)_180px]"
                      : "lg:grid lg:grid-cols-[minmax(0,1fr)_200px]",
                  )}
                  pageParamName={activePageParamName}
                  search={{
                    value: search,
                    placeholder:
                      activeTab === "inventory"
                        ? "Search product name, SKU, or barcode"
                        : "Search product, SKU, or barcode",
                  }}
                  filters={
                    activeTab === "inventory"
                      ? [
                          {
                            type: "select",
                            name: "stockState",
                            value: stockState,
                            options: INVENTORY_STOCK_STATE_OPTIONS.map((option) => ({
                              value: option.value,
                              label: option.label,
                            })),
                          },
                        ]
                      : [
                          {
                            type: "select",
                            name: "movementType",
                            value: movementType,
                            options: [
                              { value: "", label: "All movement types" },
                              { value: "stock_in", label: formatInventoryMovementType("stock_in") },
                              { value: "adjustment", label: formatInventoryMovementType("adjustment") },
                              { value: "damaged", label: formatInventoryMovementType("damaged") },
                              {
                                value: "service_usage",
                                label: formatInventoryMovementType("service_usage"),
                              },
                              { value: "pos_sale", label: formatInventoryMovementType("pos_sale") },
                              { value: "return", label: formatInventoryMovementType("return") },
                            ],
                          },
                        ]
                  }
                />
              </div>
            </PageTabToolbar>
          }
          footer={
            <DataTablePagination
              page={activePagination.page}
              pageSize={activePagination.pageSize}
              totalItems={activePagination.totalItems}
              totalPages={activePagination.totalPages}
              startItem={activePagination.startItem}
              endItem={activePagination.endItem}
              pageParamName={activePageParamName}
            />
          }
        >
          {activeTab === "inventory" ? (
            stockPagination.totalItems === 0 ? (
              <div className="p-5">
                <EmptyState
                  title="No stock records found"
                  description="Adjust filters or review products to populate branch inventory."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">On hand</TableHead>
                      <TableHead className="text-right">Reserved</TableHead>
                      <TableHead className="text-right">Available</TableHead>
                      <TableHead className="text-right">Reorder</TableHead>
                      <TableHead>Shelf</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="w-14 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockPagination.items.map((stock) => (
                      <TableRow key={stock.productId}>
                        <TableCell className="min-w-[200px]">
                          <DataTableCellStack>
                            <DataTablePrimaryText>{stock.productName}</DataTablePrimaryText>
                            <DataTableSecondaryText>
                              {formatDataTableMetaLine([
                                stock.sku ? `SKU ${stock.sku}` : "No SKU",
                                stock.categoryName ?? "Uncategorized",
                              ])}
                            </DataTableSecondaryText>
                          </DataTableCellStack>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatInventoryQuantity(stock.quantityOnHand)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatInventoryQuantity(stock.reservedQuantity)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatInventoryQuantity(stock.availableQuantity)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {stock.reorderLevel !== null
                            ? formatInventoryQuantity(stock.reorderLevel)
                            : "—"}
                        </TableCell>
                        <TableCell className="max-w-[120px] truncate text-sm text-muted-foreground">
                          {stock.shelfLocation ?? "—"}
                        </TableCell>
                        <TableCell>
                          <InventoryStockStatusBadge stock={stock} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(stock.quantityOnHand * stock.costPrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          <InventoryStockRowActions
                            product={{
                              id: stock.productId,
                              label: stock.productName,
                              sku: stock.sku,
                              quantityOnHand: stock.quantityOnHand,
                              availableQuantity: stock.availableQuantity,
                              reorderLevel: stock.reorderLevel,
                              shelfLocation: stock.shelfLocation,
                              hasStockRecord: stock.hasStockRecord,
                            }}
                            canCreateProducts={inventory.permissions.canCreateProducts}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          ) : movementPagination.totalItems === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No stock movements found"
                description="Stock movements appear here after inventory adjustments, sales, or service usage."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Stock change</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movementPagination.items.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDateTime(movement.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DataTableCellStack>
                          <DataTablePrimaryText>{movement.productName}</DataTablePrimaryText>
                          <DataTableSecondaryText>
                            {movement.sku ? `SKU ${movement.sku}` : "No SKU"}
                          </DataTableSecondaryText>
                        </DataTableCellStack>
                      </TableCell>
                      <TableCell>
                        <InventoryMovementTypeBadge type={movement.movementType} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatInventoryQuantity(movement.quantity)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                        {formatInventoryQuantity(movement.previousQuantity)} →{" "}
                        {formatInventoryQuantity(movement.newQuantity)}
                      </TableCell>
                      <TableCell className="max-w-[280px] truncate text-sm text-muted-foreground">
                        {movement.notes ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DataTableCard>
      </div>
    </div>
  );
}
