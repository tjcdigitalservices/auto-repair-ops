"use client";

import { useSyncExternalStore } from "react";

import { SandboxRouter } from "@/features/sandbox/components/sandbox-router";
import { readSandboxShop, subscribeSandboxShop } from "@/features/sandbox/store";

export default function SandboxPage() {
  const snapshot = useSyncExternalStore(subscribeSandboxShop, readSandboxShop, () => null);
  if (!snapshot) return null;
  return <SandboxRouter snapshot={snapshot} />;
}
