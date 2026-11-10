import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CustomerPortalLoginSuccess({
  customerName,
  email,
  temporaryPassword,
  customerId,
}: {
  customerName: string;
  email: string;
  temporaryPassword: string;
  customerId: string;
}) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>Customer app login created</CardTitle>
        <CardDescription>
          Share these credentials with {customerName} once. They will not be shown again after you
          leave this page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-2xl border border-border/70 bg-muted/15 px-4 py-4">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Login email
              </dt>
              <dd className="font-mono text-sm text-foreground">{email}</dd>
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
          The customer can sign in on the mobile app with this email and temporary password. Ask
          them to change the password from Account after their first login.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={`/customers/${customerId}`}>Open customer profile</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/customers">Back to customers</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
