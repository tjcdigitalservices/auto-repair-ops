"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { buildPosCategoryFilters, matchesPosCategoryFilter } from "@/features/pos/constants";
import { PosProductTile } from "@/features/pos/components/pos-product-tile";
import type { PosCartItem, PosProductOption, PosTerminalConfig } from "@/features/pos/types";
import type { ProductFormOptionsData } from "@/features/products/types";
import {
  addProductToCart,
  findPosProductByScanValue,
} from "@/features/pos/utils";
import { QuickCreateProductDialog } from "@/features/products/components/quick-create-product-dialog";
import { cn } from "@/lib/utils";

export function PosProductCatalog({
  config,
  products,
  items,
  canCreateProducts,
  productFormOptions = null,
  onProductsChange,
  onAddProduct,
}: {
  config: PosTerminalConfig;
  products: PosProductOption[];
  items: PosCartItem[];
  canCreateProducts: boolean;
  productFormOptions?: ProductFormOptionsData | null;
  onProductsChange: (products: PosProductOption[]) => void;
  onAddProduct: (product: PosProductOption) => void;
}) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const categoryFilters = useMemo(
    () => buildPosCategoryFilters(products.map((product) => product.categoryName)),
    [products],
  );

  const cartQuantityByProductId = useMemo(
    () => new Map(items.map((item) => [item.productId, item.quantity])),
    [items],
  );

  const filteredProducts = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return products.filter((product) => {
      if (!matchesPosCategoryFilter(product.categoryName, categoryFilter)) {
        return false;
      }

      if (!needle) {
        return true;
      }

      return [product.name, product.sku ?? "", product.barcode ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [categoryFilter, products, search]);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  function handleAddProduct(product: PosProductOption) {
    const inCart = items.find((item) => item.productId === product.id);
    const atMax =
      product.availableQuantity <= 0 ||
      (inCart ? inCart.quantity >= product.availableQuantity : false);

    if (atMax) {
      return;
    }

    onAddProduct(product);
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    const scannedProduct = findPosProductByScanValue(products, search);

    if (scannedProduct) {
      handleAddProduct(scannedProduct);
      setSearch("");
      return;
    }

    if (filteredProducts.length === 1) {
      handleAddProduct(filteredProducts[0]!);
      setSearch("");
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-border/70 bg-card shadow-sm">
      <div className="space-y-3 border-b border-border/60 p-3">
        {canCreateProducts ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <QuickCreateProductDialog
              triggerLabel="New product"
              initialOptions={productFormOptions}
              onCreated={(product) => {
                onProductsChange(
                  (() => {
                    const nextProduct: PosProductOption = {
                      id: product.id,
                      name: product.label,
                      sku: product.sku,
                      barcode: product.barcode,
                      imageUrl: product.productImageUrl,
                      unitLabel: product.unitLabel,
                      categoryId: null,
                      categoryName: null,
                      sellingPrice: product.unitPrice,
                      availableQuantity: 0,
                      reorderLevel: product.reorderLevel,
                      shelfLocation: product.shelfLocation,
                      hasStockRecord: false,
                      isLowStock: true,
                    };

                    return products.some((entry) => entry.id === product.id)
                      ? products.map((entry) => (entry.id === product.id ? nextProduct : entry))
                      : [...products, nextProduct];
                  })(),
                );
                setSearch(product.label);
              }}
            />
          </div>
        ) : null}

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            id="productSearch"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={
              config.enableBarcodeSupport
                ? "Search name, SKU, or scan barcode"
                : "Search name or SKU"
            }
            className="h-10 pl-9"
            autoComplete="off"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {categoryFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setCategoryFilter(filter)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                categoryFilter === filter
                  ? "border-primary/20 bg-primary/10 text-primary"
                  : "border-border/70 bg-background text-muted-foreground hover:bg-muted/40 hover:text-foreground",
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {filteredProducts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            No matching products found.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filteredProducts.map((product) => {
              const inCartQuantity = cartQuantityByProductId.get(product.id) ?? 0;
              const addDisabled =
                product.availableQuantity <= 0 ||
                (inCartQuantity > 0 && inCartQuantity >= product.availableQuantity);

              return (
                <PosProductTile
                  key={product.id}
                  product={product}
                  disabled={addDisabled}
                  inCartQuantity={inCartQuantity}
                  onSelect={() => handleAddProduct(product)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
