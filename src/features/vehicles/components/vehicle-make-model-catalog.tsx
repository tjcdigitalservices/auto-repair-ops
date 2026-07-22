"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { DataTableFilters } from "@/components/shared/data-table-filters";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { VehicleAddMakeDialog } from "@/features/vehicles/components/vehicle-add-make-dialog";
import { VehicleAddModelDialog } from "@/features/vehicles/components/vehicle-add-model-dialog";
import {
  VehicleMakeRowActions,
  VehicleModelRowActions,
} from "@/features/vehicles/components/vehicle-lookup-row-actions";
import {
  buildVehicleMakeModelGroups,
  CATALOG_LIST_PAGE_PARAM,
  CATALOG_MAKE_FILTER_PARAM,
  CATALOG_SEARCH_PARAM,
} from "@/features/vehicles/components/vehicle-lookup-utils";
import type { VehicleMakeItem, VehicleModelItem } from "@/features/vehicles/types";
import { paginateItems } from "@/lib/pagination";

export function VehicleMakeModelCatalog({
  makes,
  models,
  summary,
}: {
  makes: VehicleMakeItem[];
  models: VehicleModelItem[];
  summary: {
    activeMakes: number;
    activeModels: number;
  };
}) {
  const searchParams = useSearchParams();
  const catalogSearch = searchParams.get(CATALOG_SEARCH_PARAM) ?? "";
  const catalogMakeFilter = searchParams.get(CATALOG_MAKE_FILTER_PARAM) ?? "";
  const groupedCatalog = useMemo(
    () => buildVehicleMakeModelGroups(makes, models, catalogSearch, catalogMakeFilter),
    [catalogMakeFilter, catalogSearch, makes, models],
  );
  const catalogPage = searchParams.get(CATALOG_LIST_PAGE_PARAM) ?? undefined;
  const catalogPagination = useMemo(
    () => paginateItems(groupedCatalog, catalogPage),
    [catalogPage, groupedCatalog],
  );
  const activeMakes = useMemo(
    () => makes.filter((make) => make.status === "active"),
    [makes],
  );
  const hasSearch = catalogSearch.trim().length > 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Makes:</span> {summary.activeMakes}
          <span className="mx-2 text-border">•</span>
          <span className="font-medium text-foreground">Models:</span> {summary.activeModels}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <VehicleAddMakeDialog />
          <VehicleAddModelDialog makes={activeMakes} />
        </div>
      </div>

      {makes.length > 0 ? (
        <DataTableFilters
          key={`${catalogSearch}:${catalogMakeFilter}`}
          className="lg:grid lg:grid-cols-[minmax(0,1fr)_220px]"
          pageParamName={CATALOG_LIST_PAGE_PARAM}
          search={{
            name: CATALOG_SEARCH_PARAM,
            value: catalogSearch,
            placeholder: "Search make or model",
          }}
          filters={[
            {
              type: "select",
              name: CATALOG_MAKE_FILTER_PARAM,
              value: catalogMakeFilter,
              options: [
                { value: "", label: "All makes" },
                ...makes.map((make) => ({
                  value: make.id,
                  label: make.name,
                })),
              ],
            },
          ]}
        />
      ) : null}

      {groupedCatalog.length === 0 ? (
        <EmptyState
          title={makes.length === 0 ? "No makes yet" : "No matching makes or models"}
          description={
            makes.length === 0
              ? "Add the first make, then add models under it."
              : "Try a different search term or make filter."
          }
          action={makes.length === 0 ? <VehicleAddMakeDialog /> : undefined}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/70 bg-background">
          <div className="divide-y divide-border/70">
            {catalogPagination.items.map((group) => (
              <details
                key={group.make.id}
                className="group"
                open={hasSearch || undefined}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-2.5 hover:bg-muted/20 [&::-webkit-details-marker]:hidden">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                    <span className="truncate font-medium text-foreground">{group.make.name}</span>
                    <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                      ({group.models.length})
                    </span>
                    {group.make.status !== "active" ? (
                      <StatusBadge tone="neutral" variant="table">
                        Inactive
                      </StatusBadge>
                    ) : null}
                  </div>
                  <div
                    className="shrink-0"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <VehicleMakeRowActions make={group.make} />
                  </div>
                </summary>

                <div className="border-t border-border/50 bg-muted/10">
                  {group.models.length === 0 ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 pl-11">
                      <p className="text-sm text-muted-foreground">No models yet for this make.</p>
                      {group.make.status === "active" ? (
                        <VehicleAddModelDialog
                          makes={activeMakes}
                          defaultMakeId={group.make.id}
                          triggerLabel="Add model"
                          triggerVariant="outline"
                        />
                      ) : null}
                    </div>
                  ) : (
                    <ul className="divide-y divide-border/40">
                      {group.models.map((model) => (
                        <li
                          key={model.id}
                          className="flex items-center justify-between gap-3 px-4 py-2 pl-11"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="truncate text-sm text-foreground">{model.name}</span>
                            {model.status !== "active" ? (
                              <StatusBadge tone="neutral" variant="table">
                                Inactive
                              </StatusBadge>
                            ) : null}
                          </div>
                          <VehicleModelRowActions model={model} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </details>
            ))}
          </div>

          <DataTablePagination
            page={catalogPagination.page}
            pageSize={catalogPagination.pageSize}
            totalItems={catalogPagination.totalItems}
            totalPages={catalogPagination.totalPages}
            startItem={catalogPagination.startItem}
            endItem={catalogPagination.endItem}
            pageParamName={CATALOG_LIST_PAGE_PARAM}
          />
        </div>
      )}
    </div>
  );
}
