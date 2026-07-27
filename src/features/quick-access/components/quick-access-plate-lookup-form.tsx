"use client";

import { Loader2, ScanSearch } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { DeviceScannerOverlay } from "@/components/scanning/device-scanner-overlay";
import { SearchInput } from "@/components/shared/search-input";
import { fieldAriaProps } from "@/components/shared/form-status";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { normalizeQuickAccessPlate } from "@/features/quick-access/utils";
import { useCompactLayout } from "@/lib/device/use-compact-layout";

export function QuickAccessPlateLookupForm({
  initialPlate,
  onLookupSubmitted,
}: {
  initialPlate: string;
  onLookupSubmitted?: () => void;
}) {
  const router = useRouter();
  const isCompact = useCompactLayout();
  const [plateInput, setPlateInput] = useState(initialPlate);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function submitPlateLookup(rawPlate: string) {
    const normalizedPlate = normalizeQuickAccessPlate(rawPlate);

    if (!normalizedPlate) {
      return;
    }

    onLookupSubmitted?.();
    startTransition(() => {
      router.push(`/quick-access?q=${encodeURIComponent(normalizedPlate)}`);
    });
  }

  return (
    <div className="space-y-4">
      <form
        className="flex flex-col gap-3 md:flex-row md:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          submitPlateLookup(plateInput);
        }}
      >
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="quickAccessPlateSearch" required>
            Plate number
          </Label>
          <SearchInput
            id="quickAccessPlateSearch"
            value={plateInput}
            onChange={(event) => setPlateInput(event.target.value.toUpperCase())}
            placeholder="Enter plate number"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            {...fieldAriaProps({ name: "plate", required: true })}
          />
        </div>
        <Button type="submit" className="shrink-0" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <ScanSearch className="size-4" />}
          Search record
        </Button>
      </form>

      {isCompact ? (
        <Button type="button" variant="outline" className="w-full" onClick={() => setScannerOpen(true)}>
          <ScanSearch className="size-4" />
          Scan plate with camera
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">
          On a phone or tablet, use the camera icon in the Quick Access search bar to scan a plate.
        </p>
      )}

      <DeviceScannerOverlay
        mode="vehicle_plate"
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={(value) => {
          setPlateInput(value);
          submitPlateLookup(value);
        }}
      />
    </div>
  );
}
