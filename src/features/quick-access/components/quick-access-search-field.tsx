"use client";

import { useEffect } from "react";
import { Camera, Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { DeviceScannerOverlay } from "@/components/scanning/device-scanner-overlay";
import { ActiveIntakeCameraGuard } from "@/features/quick-access/components/active-intake-camera-guard";
import { useQuickAccessScanner } from "@/features/quick-access/components/quick-access-scanner-context";
import { useActiveIntake } from "@/features/quick-access/intake/active-intake-provider";
import { buildQuickAccessIntakeHref } from "@/features/quick-access/intake/active-intake-session";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { normalizeQuickAccessPlate, resolveQuickAccessQuery } from "@/features/quick-access/utils";
import { useCompactLayout } from "@/lib/device/use-compact-layout";
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
  const isCompact = useCompactLayout();
  const { session, finishIntake } = useActiveIntake();
  const { registerScannerOpener } = useQuickAccessScanner();
  const [query, setQuery] = useState(initialQuery);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraGuardOpen, setCameraGuardOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const showCameraButton = showCamera && isCompact;

  useEffect(() => {
    registerScannerOpener(() => setScannerOpen(true));
    return () => registerScannerOpener(null);
  }, [registerScannerOpener]);

  function runLookup(rawQuery: string, options?: { fromScan?: boolean }) {
    const trimmed = rawQuery.trim();

    if (!trimmed) {
      return;
    }

    startTransition(() => {
      const params = new URLSearchParams({ q: trimmed });
      if (options?.fromScan) {
        params.set("arrivalSource", "plate_scanner");
      }
      router.push(`/quick-access?${params.toString()}`);
    });
  }

  function handleScan(rawValue: string) {
    const { plateQuery } = resolveQuickAccessQuery(rawValue);
    const normalized = plateQuery || normalizeQuickAccessPlate(rawValue);

    if (!normalized) {
      return;
    }

    setQuery(normalized);
    runLookup(normalized, { fromScan: true });
  }

  function openCameraFlow() {
    if (session) {
      setCameraGuardOpen(true);
      return;
    }

    setScannerOpen(true);
  }

  function handleSwitchVehicle() {
    finishIntake();
    setScannerOpen(true);
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
              className={cn("h-11 pl-9", showCameraButton ? "pr-12" : "pr-3")}
            />
            {showCameraButton ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 size-9 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={openCameraFlow}
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

      <ActiveIntakeCameraGuard
        open={cameraGuardOpen}
        onOpenChange={setCameraGuardOpen}
        onContinueCurrent={() => {
          if (!session) {
            return;
          }

          router.push(buildQuickAccessIntakeHref(session.customerId, session.vehicleId));
        }}
        onSwitchVehicle={handleSwitchVehicle}
      />

      <DeviceScannerOverlay
        mode="vehicle_plate"
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={handleScan}
      />
    </>
  );
}
