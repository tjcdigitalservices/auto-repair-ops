"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  ACTIVE_INTAKE_INACTIVITY_MS,
  clearActiveIntakeSession,
  markActiveIntakeUnsavedWork,
  readActiveIntakeSession,
  touchActiveIntakeSession,
  writeActiveIntakeSession,
  type ActiveIntakeSession,
} from "@/features/quick-access/intake/active-intake-session";
import { formatQuickAccessWorkflowStatus } from "@/features/quick-access/intake/intake-workflow-status";
import type { QuickAccessWorkflowAction } from "@/features/quick-access/workflow";

type ActiveIntakeContextValue = {
  session: ActiveIntakeSession | null;
  startSession: (input: Omit<ActiveIntakeSession, "startedAt" | "lastActivityAt" | "hasUnsavedWork">) => void;
  updateWorkflow: (action: QuickAccessWorkflowAction) => void;
  finishIntake: () => void;
  clearSession: () => void;
  markUnsavedWork: (hasUnsavedWork: boolean) => void;
  shouldWarnBeforeSwitch: () => boolean;
};

const ActiveIntakeContext = createContext<ActiveIntakeContextValue | null>(null);

export function ActiveIntakeProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ActiveIntakeSession | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSession(readActiveIntakeSession());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }

    const interval = window.setInterval(() => {
      const current = readActiveIntakeSession();

      if (!current) {
        setSession(null);
        return;
      }

      if (Date.now() - Date.parse(current.lastActivityAt) > ACTIVE_INTAKE_INACTIVITY_MS) {
        clearActiveIntakeSession();
        setSession(null);
      }
    }, 60_000);

    return () => window.clearInterval(interval);
  }, [session]);

  const startSession = useCallback(
    (input: Omit<ActiveIntakeSession, "startedAt" | "lastActivityAt" | "hasUnsavedWork">) => {
      const now = new Date().toISOString();
      const next: ActiveIntakeSession = {
        ...input,
        startedAt: now,
        lastActivityAt: now,
        hasUnsavedWork: false,
      };

      writeActiveIntakeSession(next);
      setSession(next);
    },
    [],
  );

  const updateWorkflow = useCallback((action: QuickAccessWorkflowAction) => {
    setSession((current) => {
      if (!current) {
        return current;
      }

      const next = touchActiveIntakeSession({
        ...current,
        workflowState: action.state,
        workflowStatusLabel: formatQuickAccessWorkflowStatus(action.state),
      });

      return next;
    });
  }, []);

  const finishIntake = useCallback(() => {
    clearActiveIntakeSession();
    setSession(null);
  }, []);

  const clearSession = useCallback(() => {
    clearActiveIntakeSession();
    setSession(null);
  }, []);

  const markUnsavedWork = useCallback((hasUnsavedWork: boolean) => {
    markActiveIntakeUnsavedWork(hasUnsavedWork);
    setSession(readActiveIntakeSession());
  }, []);

  const shouldWarnBeforeSwitch = useCallback(() => {
    const current = session ?? readActiveIntakeSession();

    if (!current) {
      return false;
    }

    return (
      current.hasUnsavedWork || current.workflowState === "continue_draft_quotation"
    );
  }, [session]);

  const value = useMemo(
    () => ({
      session: hydrated ? session : null,
      startSession,
      updateWorkflow,
      finishIntake,
      clearSession,
      markUnsavedWork,
      shouldWarnBeforeSwitch,
    }),
    [
      finishIntake,
      clearSession,
      hydrated,
      markUnsavedWork,
      session,
      shouldWarnBeforeSwitch,
      startSession,
      updateWorkflow,
    ],
  );

  return <ActiveIntakeContext.Provider value={value}>{children}</ActiveIntakeContext.Provider>;
}

export function useActiveIntake() {
  const context = useContext(ActiveIntakeContext);

  if (!context) {
    throw new Error("useActiveIntake must be used within ActiveIntakeProvider");
  }

  return context;
}

export function useOptionalActiveIntake() {
  return useContext(ActiveIntakeContext);
}
