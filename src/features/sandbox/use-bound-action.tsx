"use client";

import { useActionState, useContext, createContext } from "react";

const SandboxModeContext = createContext(false);

export function SandboxModeProvider({ children }: { children: React.ReactNode }) {
  return <SandboxModeContext.Provider value={true}>{children}</SandboxModeContext.Provider>;
}

export function useSandboxOptional() {
  return useContext(SandboxModeContext);
}

export function useBoundAction<State extends { status: string }, Payload>(
  serverAction: (state: State, payload: Payload) => Promise<State>,
  localAction: (state: State, payload: Payload) => Promise<State>,
  initialState: State,
) {
  const sandbox = useSandboxOptional();
  return useActionState(
    (sandbox ? localAction : serverAction) as (
      state: Awaited<State>,
      payload: Payload,
    ) => State | Promise<State>,
    initialState as Awaited<State>,
  );
}

export function useBoundFormAction(
  serverAction: (formData: FormData) => void | Promise<void>,
  localAction: (formData: FormData) => void | Promise<void>,
) {
  const sandbox = useSandboxOptional();
  return sandbox ? localAction : serverAction;
}
