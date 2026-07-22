export const DEFAULT_TABLE_PAGE_SIZE = 25;

export const TABLE_PAGE_SIZE_OPTIONS = [25, 50, 100, 250] as const;

export type TablePageSize = (typeof TABLE_PAGE_SIZE_OPTIONS)[number];

export function parsePageParam(value?: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.floor(parsed);
}

export function parsePageSizeParam(
  value?: string,
  fallback: TablePageSize = DEFAULT_TABLE_PAGE_SIZE,
): TablePageSize {
  const parsed = Number(value);

  if (TABLE_PAGE_SIZE_OPTIONS.includes(parsed as TablePageSize)) {
    return parsed as TablePageSize;
  }

  return fallback;
}

export function paginateItems<T>(
  items: readonly T[],
  pageParam?: string,
  pageSize: string | number = DEFAULT_TABLE_PAGE_SIZE,
) {
  const resolvedPageSize =
    typeof pageSize === "number" ? pageSize : parsePageSizeParam(pageSize);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / resolvedPageSize));
  const requestedPage = parsePageParam(pageParam);
  const page = Math.min(requestedPage, totalPages);
  const startIndex = totalItems === 0 ? 0 : (page - 1) * resolvedPageSize;
  const endIndex = Math.min(startIndex + resolvedPageSize, totalItems);

  return {
    items: items.slice(startIndex, endIndex),
    totalItems,
    totalPages,
    page,
    pageSize: resolvedPageSize,
    startItem: totalItems === 0 ? 0 : startIndex + 1,
    endItem: endIndex,
  };
}
