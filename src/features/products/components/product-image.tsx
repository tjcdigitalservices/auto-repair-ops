import { ImageOff, Package } from "lucide-react";

import { cn } from "@/lib/utils";

export function ProductImage({
  src,
  alt,
  className,
  imageClassName,
  compact = false,
}: {
  src: string | null;
  alt: string;
  className?: string;
  imageClassName?: string;
  /** Icon-only placeholder for dense table rows. */
  compact?: boolean;
}) {
  if (src) {
    return (
      <div className={cn("overflow-hidden rounded-lg bg-muted/30", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className={cn("h-full w-full object-cover", imageClassName)}
        />
      </div>
    );
  }

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/40 text-muted-foreground",
          className,
        )}
        aria-hidden
      >
        <Package className="size-4 shrink-0" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-2xl border border-dashed border-border/80 bg-brand-soft/35 text-brand-navy",
        className,
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-white/80 shadow-sm">
        <ImageOff className="size-5" />
      </span>
    </div>
  );
}
