import Link from "next/link";

import { DataTableCard } from "@/components/shared/data-table-card";
import { DataTableFilters } from "@/components/shared/data-table-filters";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import {
  DataTableCellStack,
  DataTablePrimaryText,
  DataTableSecondaryText,
  formatDataTableMetaLine,
} from "@/components/shared/data-table-cells";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { PageHeaderActions, PagePrimaryAction } from "@/components/shared/page-header-actions";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductPageActionsMenu } from "@/features/products/components/product-page-actions-menu";
import { ProductImage } from "@/features/products/components/product-image";
import { ProductRowActions } from "@/features/products/components/product-row-actions";
import { listProducts } from "@/features/products/queries/product-queries";
import { formatCurrency } from "@/lib/currency";
import { paginateItems } from "@/lib/pagination";

export const dynamic = "force-dynamic";

type ProductsPageProps = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    pageSize?: string;
  }>;
};

function formatSupplierLabel(supplierName: string | null) {
  return supplierName?.trim() ? supplierName : "—";
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { search = "", page, pageSize } = await searchParams;
  const products = await listProducts(search);
  const pagination = paginateItems(products, page, pageSize);

  return (
    <div className="space-y-3">
      <PageHeader
        title="Products"
        description="Catalog master data for inventory, quotations, and point-of-sale."
        actions={
          <PageHeaderActions
            primary={<PagePrimaryAction href="/products/new">New Product</PagePrimaryAction>}
            overflow={<ProductPageActionsMenu />}
          />
        }
      />

      <DataTableCard
        contentClassName="p-0"
        toolbar={
          <DataTableFilters
            key={search}
            className="md:grid md:grid-cols-[minmax(0,1fr)]"
            search={{
              value: search,
              placeholder: "Search name, SKU, barcode, or part number",
            }}
          />
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
          <div className="p-5">
            <EmptyState
              title="No products found"
              description="Create the first product so inventory, quotations, and POS can reference it."
              action={
                <Button asChild>
                  <Link href="/products/new">Create product</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[min(28%,320px)]">Product</TableHead>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead className="min-w-[140px]">Supplier</TableHead>
                  <TableHead className="w-[120px] text-right">Price</TableHead>
                  <TableHead className="w-[88px] text-right">Reorder</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-14 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.items.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <ProductImage
                          src={product.productImageUrl}
                          alt={product.name}
                          className="size-9 shrink-0"
                          compact
                        />
                        <DataTableCellStack>
                          <DataTablePrimaryText>{product.name}</DataTablePrimaryText>
                          <DataTableSecondaryText>
                            {formatDataTableMetaLine([
                              product.sku ? `SKU ${product.sku}` : "No SKU",
                              product.categoryName ?? "Uncategorized",
                              product.unitLabel,
                            ])}
                          </DataTableSecondaryText>
                        </DataTableCellStack>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">
                      {product.productType.replaceAll("_", " ")}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate text-muted-foreground">
                      {formatSupplierLabel(product.supplierName)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DataTablePrimaryText className="tabular-nums">
                        {formatCurrency(product.sellingPrice)}
                      </DataTablePrimaryText>
                      <DataTableSecondaryText className="tabular-nums">
                        Cost {formatCurrency(product.costPrice)}
                      </DataTableSecondaryText>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {product.reorderLevel}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        tone={product.status === "active" ? "success" : "neutral"}
                        variant="table"
                      >
                        {product.status}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <ProductRowActions
                        productId={product.id}
                        productName={product.name}
                        canManage={product.canManage}
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
