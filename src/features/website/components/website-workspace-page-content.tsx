import Link from "next/link";
import { ChevronRight, Globe } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import {
  PageHeaderActions,
  PagePrimaryAction,
} from "@/components/shared/page-header-actions";
import {
  InteractiveStatCardLink,
  interactiveStatCardClassName,
} from "@/components/shared/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { WebsitePageActionsMenu } from "@/features/website/components/website-page-actions-menu";
import type { WebsiteWorkspaceData } from "@/features/website/types";
import { formatWebsiteActivityTypeLabel } from "@/features/website/utils";
import { formatDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function WebsiteWorkspacePageContent({ data }: { data: WebsiteWorkspaceData }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Website"
        description="Manage your public website, catalog, journal, and inbound leads."
        actions={
          <PageHeaderActions
            primary={
              <PagePrimaryAction href="/products/new">Publish Product</PagePrimaryAction>
            }
            overflow={<WebsitePageActionsMenu />}
          />
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_240px]">
        <section className="grid gap-6 md:grid-cols-3">
          <WebsiteSectionNavCard
            title="Products"
            description="Manage products displayed on your website."
            stats={[
              { label: "Published", value: data.products.published },
              { label: "Draft", value: data.products.draft },
            ]}
            href="/products"
          />
          <WebsiteSectionNavCard
            title="Garage Journal"
            description="Publish shop updates, tips, and promotions."
            stats={[
              { label: "Published", value: data.journal.published },
              { label: "Draft", value: data.journal.draft },
            ]}
            href="/settings/website/journal"
          />
          <WebsiteSectionNavCard
            title="Quote Requests"
            description="Review inbound leads from your public quote form."
            stats={[{ label: "Pending", value: data.quoteRequests.pending }]}
            href="/quotations/website-requests"
          />
        </section>

        <WebsiteStatusCard status={data.status} />
      </div>

      <Card className="min-w-0 border-border/70 shadow-sm">
        <CardContent className="space-y-4 p-6">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">Recent activity</h2>
            <p className="text-sm text-muted-foreground">
              Latest changes across your public website workspace.
            </p>
          </div>

          {data.recentActivity.length === 0 ? (
            <div className="overflow-hidden rounded-[1.25rem] border border-border/70 p-6">
              <EmptyState
                title="No recent website activity"
                description="Product updates, journal posts, and quote requests will appear here."
              />
            </div>
          ) : (
            <div className="overflow-hidden rounded-[1.25rem] border border-border/70">
              <ul className="divide-y divide-border/70">
                {data.recentActivity.map((activity) => (
                  <li key={activity.id}>
                    {activity.href ? (
                      <Link
                        href={activity.href}
                        className="flex items-start justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/20"
                      >
                        <WebsiteActivityRow activity={activity} />
                      </Link>
                    ) : (
                      <div className="flex items-start justify-between gap-4 px-4 py-3">
                        <WebsiteActivityRow activity={activity} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function WebsiteSectionNavCard({
  title,
  description,
  stats,
  href,
}: {
  title: string;
  description: string;
  stats: Array<{ label: string; value: number }>;
  href: string;
}) {
  return (
    <InteractiveStatCardLink href={href}>
      <Card className={cn("min-w-0 border-border/70", interactiveStatCardClassName)}>
        <CardContent className="flex h-full flex-col space-y-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h3 className="text-base font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          </div>

          <dl
            className={cn(
              "grid gap-3 text-sm",
              stats.length > 1 ? "grid-cols-2" : "grid-cols-1",
            )}
          >
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border/70 bg-muted/15 px-3 py-2">
                <dt className="text-muted-foreground">{stat.label}</dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </InteractiveStatCardLink>
  );
}

function WebsiteStatusCard({
  status,
}: {
  status: WebsiteWorkspaceData["status"];
}) {
  return (
    <Card className="min-w-0 border-border/70 shadow-sm xl:row-span-1">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Globe className="size-4 text-muted-foreground" />
          Status
        </div>

        <div className="space-y-3 text-sm">
          <div className="rounded-xl border border-border/70 bg-muted/15 px-3 py-2">
            <p className="text-muted-foreground">Website</p>
            <p className="mt-1 font-medium text-foreground">
              {status.isOnline ? "🟢 Online" : "🔴 Offline"}
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-muted/15 px-3 py-2">
            <p className="text-muted-foreground">Public URL</p>
            {status.publicUrl ? (
              <a
                href={status.publicUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block truncate font-medium text-brand-navy hover:underline"
              >
                {status.publicUrl}
              </a>
            ) : (
              <p className="mt-1 font-medium text-foreground">Not configured</p>
            )}
          </div>

          <div className="rounded-xl border border-border/70 bg-muted/15 px-3 py-2">
            <p className="text-muted-foreground">Last published</p>
            <p className="mt-1 font-medium text-foreground">
              {status.lastPublishedAt ? formatDateTime(status.lastPublishedAt) : "—"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WebsiteActivityRow({
  activity,
}: {
  activity: WebsiteWorkspaceData["recentActivity"][number];
}) {
  return (
    <>
      <div className="min-w-0 space-y-1">
        <p className="font-medium text-foreground">
          {activity.title || formatWebsiteActivityTypeLabel(activity.type)}
        </p>
        <p className="truncate text-sm text-muted-foreground">{activity.detail}</p>
      </div>
      <time
        dateTime={activity.occurredAt}
        className="shrink-0 text-xs text-muted-foreground"
      >
        {formatDateTime(activity.occurredAt)}
      </time>
    </>
  );
}
