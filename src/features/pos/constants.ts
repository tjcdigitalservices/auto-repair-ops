/** Quick category chips shown first when products exist in those categories. */
export const POS_QUICK_CATEGORY_FILTERS = [
  "Brakes",
  "Engine",
  "Suspension",
  "Lubricants",
  "Electrical",
  "Accessories",
] as const;

export function buildPosCategoryFilters(categoryNames: Array<string | null | undefined>) {
  const normalized = new Map<string, string>();

  for (const name of categoryNames) {
    const trimmed = name?.trim();
    if (!trimmed) {
      continue;
    }

    const key = trimmed.toLowerCase();
    if (!normalized.has(key)) {
      normalized.set(key, trimmed);
    }
  }

  const ordered: string[] = ["All"];

  for (const preset of POS_QUICK_CATEGORY_FILTERS) {
    const key = preset.toLowerCase();
    if (normalized.has(key)) {
      ordered.push(normalized.get(key)!);
      normalized.delete(key);
    }
  }

  ordered.push(...[...normalized.values()].sort((left, right) => left.localeCompare(right)));

  return ordered;
}

export function matchesPosCategoryFilter(
  categoryName: string | null | undefined,
  filter: string,
) {
  if (filter === "All") {
    return true;
  }

  return categoryName?.trim().toLowerCase() === filter.toLowerCase();
}
