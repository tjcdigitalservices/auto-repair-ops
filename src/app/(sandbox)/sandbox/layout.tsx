import { Suspense } from "react";

import { SandboxShell } from "@/features/sandbox/components/sandbox-shell";

export default function SandboxLayout({ children }: { children: React.ReactNode }) {
  return (
    <SandboxShell>
      <Suspense fallback={null}>{children}</Suspense>
    </SandboxShell>
  );
}
