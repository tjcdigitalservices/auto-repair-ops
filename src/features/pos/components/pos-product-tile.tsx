import { cn } from "@/lib/utils";
import { ProductImage } from "@/features/products/components/product-image";
import type { PosProductOption } from "@/features/pos/types";
import { formatCurrency } from "@/lib/currency";

export function PosProductTile({
  product,
  disabled,
  inCartQuantity,
  onSelect,
}: {
  product: PosProductOption;
  disabled: boolean;
  inCartQuantity: number;
  onSelect: () => void;
}) {
  const stockLabel = !product.hasStockRecord
    ? "No stock record"
    : product.availableQuantity <= 0
      ? "Out of stock"
      : `${product.availableQuantity} available`;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card text-left shadow-sm transition-colors",
        "hover:border-primary/30 hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        disabled && "cursor-not-allowed opacity-55 hover:border-border/70 hover:bg-card",
        inCartQuantity > 0 && "border-primary/35 ring-1 ring-primary/15",
      )}
    >
      <div className="relative aspect-[4/3] w-full bg-muted/30">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          className="size-full rounded-none"
          imageClassName="object-cover"
          compact
        />
        {inCartQuantity > 0 ? (
          <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
            {inCartQuantity}
          </span>
        ) : null}
      </div>
      <div className="flex min-h-[88px] flex-1 flex-col gap-1 p-2.5">
        <p className="line-clamp-2 text-sm font-medium leading-tight text-foreground">{product.name}</p>
        <p className="truncate text-xs text-muted-foreground">{product.sku ?? "No SKU"}</p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <p className="text-sm font-semibold tabular-nums text-foreground">
            {formatCurrency(product.sellingPrice)}
          </p>
          <p
            className={cn(
              "text-[11px] tabular-nums",
              product.availableQuantity <= 0 || !product.hasStockRecord
                ? "text-destructive"
                : product.isLowStock
                  ? "text-warning"
                  : "text-muted-foreground",
            )}
          >
            {stockLabel}
          </p>
        </div>
      </div>
    </button>
  );
}
