import type { VehicleMakeItem, VehicleModelItem } from "@/features/vehicles/types";

export type VehicleMakeModelGroup = {
  make: VehicleMakeItem;
  models: VehicleModelItem[];
};

export function buildVehicleMakeModelGroups(
  makes: VehicleMakeItem[],
  models: VehicleModelItem[],
  search: string,
  makeId: string,
): VehicleMakeModelGroup[] {
  const query = search.trim().toLowerCase();
  const modelsByMakeId = models.reduce<Map<string, VehicleModelItem[]>>((groups, model) => {
    const existing = groups.get(model.makeId) ?? [];
    existing.push(model);
    groups.set(model.makeId, existing);
    return groups;
  }, new Map());

  return makes
    .filter((make) => !makeId || make.id === makeId)
    .map((make) => {
      const makeModels = modelsByMakeId.get(make.id) ?? [];
      const makeMatches = !query || make.name.toLowerCase().includes(query);
      const matchingModels = query
        ? makeModels.filter((model) => model.name.toLowerCase().includes(query))
        : makeModels;

      if (!makeMatches && matchingModels.length === 0) {
        return null;
      }

      return {
        make,
        models: makeMatches && query ? makeModels : matchingModels,
      };
    })
    .filter((group): group is VehicleMakeModelGroup => group !== null);
}

export const CATALOG_LIST_PAGE_PARAM = "catalogPage";
export const CATALOG_SEARCH_PARAM = "catalogSearch";
export const CATALOG_MAKE_FILTER_PARAM = "catalogMake";
