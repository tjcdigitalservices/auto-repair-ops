"use client";

import { AppLink } from "@/components/shared/app-link";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { stripSandboxBasePath } from "@/features/sandbox/constants";

import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import {
  TABLE_PAGE_SIZE_OPTIONS,
  type TablePageSize,
} from "@/lib/pagination";
import { cn } from "@/lib/utils";

export function DataTablePagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  startItem,
  endItem,
  pageParamName = "page",
  pageSizeParamName = "pageSize",
  pageSizeOptions = TABLE_PAGE_SIZE_OPTIONS,
  className,
}: {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  startItem: number;
  endItem: number;
  pageParamName?: string;
  pageSizeParamName?: string;
  pageSizeOptions?: readonly TablePageSize[];
  className?: string;
}) {
  const pathname = stripSandboxBasePath(usePathname());
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalItems === 0) {
    return null;
  }

  const pageItems = getVisiblePages(page, totalPages);

  function buildHref(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextPage <= 1) {
      params.delete(pageParamName);
    } else {
      params.set(pageParamName, String(nextPage));
    }

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  function handlePageSizeChange(nextPageSize: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(pageSizeParamName, nextPageSize);
    params.delete(pageParamName);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-border/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-sm text-muted-foreground">
          Showing {startItem}-{endItem} of {totalItems} records
          {totalItems > pageSize ? ` · Page ${page} of ${totalPages}` : ""}
        </p>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="whitespace-nowrap">Rows per page</span>
          <NativeSelect
            value={String(pageSize)}
            className="h-8 w-[5.5rem] px-2 text-sm"
            onChange={(event) => handlePageSizeChange(event.target.value)}
            aria-label="Rows per page"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </NativeSelect>
        </label>
      </div>
      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center gap-2">
          {page <= 1 ? (
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft className="size-4" />
              Previous
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <AppLink href={buildHref(page - 1)}>
                <ChevronLeft className="size-4" />
                Previous
              </AppLink>
            </Button>
          )}
          <div className="hidden items-center gap-2 sm:flex">
            {pageItems.map((pageItem, index) =>
              pageItem === "ellipsis" ? (
                <span key={`ellipsis-${index}`} className="px-1 text-muted-foreground">
                  <MoreHorizontal className="size-4" />
                </span>
              ) : (
                <Button
                  key={pageItem}
                  asChild
                  variant={pageItem === page ? "default" : "outline"}
                  size="sm"
                >
                  <AppLink href={buildHref(pageItem)}>{pageItem}</AppLink>
                </Button>
              ),
            )}
          </div>
          {page >= totalPages ? (
            <Button variant="outline" size="sm" disabled>
              Next
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <AppLink href={buildHref(page + 1)}>
                Next
                <ChevronRight className="size-4" />
              </AppLink>
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

function getVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1) as Array<number | "ellipsis">;
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "ellipsis", totalPages] as Array<number | "ellipsis">;
  }

  if (currentPage >= totalPages - 2) {
    return [1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages] as Array<
      number | "ellipsis"
    >;
  }

  return [
    1,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
    totalPages,
  ] as Array<number | "ellipsis">;
}

export function DataTableRecordSummary({
  totalItems,
  startItem = 1,
  endItem,
  className,
}: {
  totalItems: number;
  startItem?: number;
  endItem?: number;
  className?: string;
}) {
  if (totalItems === 0) {
    return null;
  }

  const resolvedEndItem = endItem ?? totalItems;

  return (
    <div
      className={cn(
        "border-t border-border/70 px-4 py-3 text-sm text-muted-foreground",
        className,
      )}
    >
      Showing {startItem}-{resolvedEndItem} of {totalItems} records
    </div>
  );
}
