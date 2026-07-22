import type { LaborPickerOption } from "@/features/labor/types";

type LaborSourceRow = {
  description: string;
  unit_price: number;
};

export function buildLaborPickerOptionId(description: string, unitPrice: number) {
  const normalized = `${description.trim().toLowerCase()}|${unitPrice}`;
  let hash = 0;

  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash << 5) - hash + normalized.charCodeAt(index);
    hash |= 0;
  }

  return `labor-${Math.abs(hash)}`;
}

export function mapLaborSourceRowToPickerOption(row: LaborSourceRow): LaborPickerOption {
  return {
    id: buildLaborPickerOptionId(row.description, row.unit_price),
    label: row.description.trim(),
    unitPrice: row.unit_price,
  };
}

export function mapInlineCreateResultToLaborPickerOption(
  labor: LaborPickerOption,
): LaborPickerOption {
  return {
    id: labor.id,
    label: labor.label.trim(),
    unitPrice: labor.unitPrice,
  };
}

export function filterLaborPickerOptions(
  options: LaborPickerOption[],
  query: string,
  selectedLaborId?: string,
) {
  const needle = query.trim().toLowerCase();

  if (!needle) {
    return options;
  }

  return options.filter((option) => {
    if (selectedLaborId && option.id === selectedLaborId) {
      return true;
    }

    return option.label.toLowerCase().includes(needle);
  });
}

export function dedupeLaborPickerOptions(options: LaborPickerOption[]) {
  const seen = new Map<string, LaborPickerOption>();

  for (const option of options) {
    const key = `${option.label.trim().toLowerCase()}|${option.unitPrice}`;

    if (!seen.has(key)) {
      seen.set(key, option);
    }
  }

  return [...seen.values()].sort((left, right) => left.label.localeCompare(right.label));
}
