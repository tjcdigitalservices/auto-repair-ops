import Link from "next/link";
import { CarFront } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buildQuickAccessNoMatchRedirectPath } from "@/features/quick-access/utils";

export function QuickAccessPlateNotFound({
  plateQuery,
  canCreateVehicle,
}: {
  plateQuery: string;
  canCreateVehicle: boolean;
}) {
  const registerHref = buildQuickAccessNoMatchRedirectPath({
    plateQuery,
    customerLastNameQuery: "",
    canCreateVehicle,
    canCreateQuotation: false,
  });

  return (
    <div className="flex h-fit flex-col items-center rounded-2xl border border-dashed border-border/80 bg-muted/25 px-6 py-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-background text-muted-foreground shadow-sm">
        <CarFront className="size-5" />
      </div>
      <h2 className="mt-4 text-base font-semibold">Vehicle not found</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
        No vehicle record matched this plate lookup.
      </p>
      <p className="mt-3 text-sm">
        <span className="text-muted-foreground">Plate: </span>
        <span className="font-semibold tabular-nums text-foreground">{plateQuery}</span>
      </p>
      {registerHref ? (
        <div className="mt-5 flex justify-center">
          <Button asChild variant="bluePrimary" size="lg">
            <Link href={registerHref}>Register vehicle</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
