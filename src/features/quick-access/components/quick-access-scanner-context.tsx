"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type QuickAccessScannerContextValue = {
  requestScanner: () => void;
  registerScannerOpener: (opener: (() => void) | null) => void;
};

const QuickAccessScannerContext = createContext<QuickAccessScannerContextValue | null>(null);

export function QuickAccessScannerProvider({ children }: { children: ReactNode }) {
  const [opener, setOpener] = useState<(() => void) | null>(null);

  const registerScannerOpener = useCallback((next: (() => void) | null) => {
    setOpener(() => next);
  }, []);

  const requestScanner = useCallback(() => {
    opener?.();
  }, [opener]);

  const value = useMemo(
    () => ({ requestScanner, registerScannerOpener }),
    [registerScannerOpener, requestScanner],
  );

  return (
    <QuickAccessScannerContext.Provider value={value}>{children}</QuickAccessScannerContext.Provider>
  );
}

export function useQuickAccessScanner() {
  const context = useContext(QuickAccessScannerContext);

  if (!context) {
    throw new Error("useQuickAccessScanner must be used within QuickAccessScannerProvider");
  }

  return context;
}

export function useOptionalQuickAccessScanner() {
  return useContext(QuickAccessScannerContext);
}
