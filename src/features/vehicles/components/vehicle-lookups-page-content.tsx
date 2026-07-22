"use client";

import { useState } from "react";

import { PageTabToolbar } from "@/components/shared/page-tabs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VehicleLookupOptionSection } from "@/features/vehicles/components/vehicle-lookup-forms";
import { VehicleMakeModelCatalog } from "@/features/vehicles/components/vehicle-make-model-catalog";
import type {
  VehicleLookupPageData,
  VehicleLookupType,
} from "@/features/vehicles/types";

const OPTION_TAB_LABELS: Record<VehicleLookupType, string> = {
  transmission: "Transmission",
  fuel_type: "Fuel type",
  color: "Color",
};

type VehicleLookupsPageTab = "catalog" | "options";

export function VehicleLookupsPageContent({ data }: { data: VehicleLookupPageData }) {
  const [activeTab, setActiveTab] = useState<VehicleLookupsPageTab>("catalog");
  const [optionsTab, setOptionsTab] = useState<VehicleLookupType>("transmission");

  return (
    <Tabs
      defaultValue="catalog"
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as VehicleLookupsPageTab)}
      className="min-w-0"
    >
      <TabsList>
        <TabsTrigger value="catalog">Make & model</TabsTrigger>
        <TabsTrigger value="options">Standard options</TabsTrigger>
      </TabsList>

      <TabsContent value="catalog">
        <PageTabToolbar>
          <VehicleMakeModelCatalog
            makes={data.makes}
            models={data.models}
            summary={{
              activeMakes: data.summary.activeMakes,
              activeModels: data.summary.activeModels,
            }}
          />
        </PageTabToolbar>
      </TabsContent>

      <TabsContent value="options">
        <PageTabToolbar className="space-y-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Transmission:</span>{" "}
            {data.summary.transmissionOptions}
            <span className="mx-2 text-border">•</span>
            <span className="font-medium text-foreground">Fuel type:</span>{" "}
            {data.summary.fuelTypeOptions}
            <span className="mx-2 text-border">•</span>
            <span className="font-medium text-foreground">Color:</span> {data.summary.colorOptions}
          </p>

          <Tabs
            defaultValue="transmission"
            value={optionsTab}
            onValueChange={(value) => setOptionsTab(value as VehicleLookupType)}
            className="min-w-0 space-y-4"
          >
            <TabsList>
              {data.optionGroups.map((group) => (
                <TabsTrigger key={group.lookupType} value={group.lookupType}>
                  {OPTION_TAB_LABELS[group.lookupType]}
                </TabsTrigger>
              ))}
            </TabsList>

            {data.optionGroups.map((group) => (
              <TabsContent key={group.lookupType} value={group.lookupType}>
                <VehicleLookupOptionSection group={group} />
              </TabsContent>
            ))}
          </Tabs>
        </PageTabToolbar>
      </TabsContent>
    </Tabs>
  );
}
