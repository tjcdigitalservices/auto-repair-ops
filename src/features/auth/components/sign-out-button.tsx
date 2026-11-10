"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/actions/auth-actions";

export function SignOutButton({
  className,
}: {
  className?: string;
}) {
  return (
    <form action={signOutAction} className="w-full">
      <SignOutSubmitButton className={className} />
    </form>
  );
}

function SignOutSubmitButton({ className }: { className?: string }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outline"
      disabled={pending}
      className={className}
    >
      {pending ? "Signing out..." : "Sign out"}
    </Button>
  );
}
