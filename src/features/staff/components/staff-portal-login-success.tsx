import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function StaffPortalLoginSuccess({
  staffName,
  username,
  temporaryPassword,
}: {
  staffName: string;
  username: string;
  temporaryPassword: string;
}) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>Mechanic portal login created</CardTitle>
        <CardDescription>
          Share these credentials with {staffName} once. They will not be shown again after you
          leave this page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-2xl border border-border/70 bg-muted/15 px-4 py-4">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Portal username
              </dt>
              <dd className="font-mono text-sm text-foreground">{username}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Temporary password
              </dt>
              <dd className="font-mono text-sm text-foreground">{temporaryPassword}</dd>
            </div>
          </dl>
        </div>

        <p className="text-sm text-muted-foreground">
          The mechanic can sign in at the attendance portal using these credentials. Ask them to
          change the password after their first login if your Supabase project requires it.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/staff">Back to staff roster</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">Open login page</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
