"use client";

import { useEffect, useState } from "react";
import { Camera, Search } from "lucide-react";
import { useRouter } from "next/navigation";

import { DeviceScannerOverlay } from "@/components/scanning/device-scanner-overlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  normalizeQuickAccessPlate,
  resolveGlobalLookupDestination,
  resolveQuickAccessQuery,
} from "@/features/quick-access/utils";
import { cn } from "@/lib/utils";

export function GlobalLookupSearch({
  inputId,
  value,
  onValueChange,
  showCamera = false,
  className,
}: {
  inputId: string;
  value: string;
  onValueChange: (value: string) => void;
  showCamera?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [scannerOpen, setScannerOpen] = useState(false);

  function navigateLookup(rawQuery: string) {
    const destination = resolveGlobalLookupDestination(rawQuery);

    if (!destination) {
      return;
    }

    router.push(destination);
  }

  function handleScan(rawValue: string) {
    const { plateQuery } = resolveQuickAccessQuery(rawValue);
    const normalized = plateQuery || normalizeQuickAccessPlate(rawValue);

    if (!normalized) {
      return;
    }

    onValueChange(normalized);
    navigateLookup(normalized);
  }

  return (
    <>
      <form
        className={cn("w-full", className)}
        onSubmit={(event) => {
          event.preventDefault();
          navigateLookup(value);
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          Search customer or vehicle records
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={inputId}
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder="Search customer, plate or phone…"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            className={cn(
              "h-11 rounded-full border-border/70 bg-muted/35 pl-11 shadow-sm transition-colors focus-visible:bg-background",
              showCamera ? "pr-12 lg:pr-4" : "pr-4",
            )}
          />
          {showCamera ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 size-9 -translate-y-1/2 text-muted-foreground hover:text-foreground lg:hidden"
              onClick={() => setScannerOpen(true)}
              aria-label="Scan plate with camera"
            >
              <Camera className="size-4" />
            </Button>
          ) : null}
        </div>
      </form>

      {showCamera ? (
        <DeviceScannerOverlay
          mode="vehicle_plate"
          open={scannerOpen}
          onOpenChange={setScannerOpen}
          onScan={handleScan}
        />
      ) : null}
    </>
  );
}

export function useSyncedGlobalLookupQuery(pathname: string, queryParam: string | null) {
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (pathname === "/quick-access" && queryParam) {
      setSearchQuery(queryParam);
      return;
    }

    if (pathname !== "/quick-access") {
      setSearchQuery("");
    }
  }, [pathname, queryParam]);

  return [searchQuery, setSearchQuery] as const;
}
