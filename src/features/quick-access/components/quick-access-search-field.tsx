"use client";

import { useEffect } from "react";
import { Camera, Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { DeviceScannerOverlay } from "@/components/scanning/device-scanner-overlay";
import { useQuickAccessScanner } from "@/features/quick-access/components/quick-access-scanner-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { normalizeQuickAccessPlate, resolveQuickAccessQuery } from "@/features/quick-access/utils";
import { cn } from "@/lib/utils";

export function QuickAccessSearchField({
  initialQuery = "",
  showCamera = true,
  className,
}: {
  initialQuery?: string;
  showCamera?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const { registerScannerOpener } = useQuickAccessScanner();
  const [query, setQuery] = useState(initialQuery);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    registerScannerOpener(() => setScannerOpen(true));
    return () => registerScannerOpener(null);
  }, [registerScannerOpener]);

  function runLookup(rawQuery: string) {
    const trimmed = rawQuery.trim();

    if (!trimmed) {
      return;
    }

    startTransition(() => {
      router.push(`/quick-access?${new URLSearchParams({ q: trimmed }).toString()}`);
    });
  }

  function handleScan(rawValue: string) {
    const { plateQuery } = resolveQuickAccessQuery(rawValue);
    const normalized = plateQuery || normalizeQuickAccessPlate(rawValue);

    if (!normalized) {
      return;
    }

    setQuery(normalized);
    runLookup(normalized);
  }

  return (
    <>
      <form
        className={cn("w-full", className)}
        onSubmit={(event) => {
          event.preventDefault();
          runLookup(query);
        }}
      >
        <div className="relative flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search customer, plate or phone…"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              className={cn("h-11 pl-9", showCamera ? "pr-12" : "pr-3")}
            />
            {showCamera ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 size-9 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setScannerOpen(true)}
                aria-label="Scan plate with camera"
              >
                <Camera className="size-4" />
              </Button>
            ) : null}
          </div>
          <Button type="submit" className="h-11 shrink-0 px-4" disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : "Search"}
          </Button>
        </div>
      </form>

      <DeviceScannerOverlay
        mode="vehicle_plate"
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={handleScan}
      />
    </>
  );
}
