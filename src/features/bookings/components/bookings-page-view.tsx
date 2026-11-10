"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingsCalendarView } from "@/features/bookings/components/bookings-calendar-view";
import { BookingsListPanel } from "@/features/bookings/components/bookings-list-panel";
import type { BookingListItem, BookingStatus, BookingsCalendarData } from "@/features/bookings/types";
import { stripSandboxBasePath } from "@/features/sandbox/constants";
import { cn } from "@/lib/utils";

export function BookingsPageView({
  bookings,
  calendarBookings,
  calendar,
  search,
  status,
  page,
  branch,
  migrationHint,
}: {
  bookings: BookingListItem[];
  calendarBookings: BookingListItem[];
  calendar: BookingsCalendarData;
  search: string;
  status: "" | BookingStatus;
  page?: string;
  branch: { id: string; name: string; code: string };
  migrationHint?: string;
}) {
  const pathname = stripSandboxBasePath(usePathname());
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeView = searchParams.get("view") === "list" ? "list" : "calendar";
  const isCalendarView = activeView === "calendar";

  function updateView(nextView: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextView === "calendar") {
      params.delete("view");
      params.delete("page");
    } else {
      params.set("view", "list");
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div
      className={cn(
        isCalendarView
          ? "flex h-[calc(100dvh-8.25rem-var(--sandbox-chrome-offset,0px))] flex-col gap-3 overflow-hidden"
          : "space-y-6",
      )}
    >
      <div className="shrink-0 space-y-3">
        <PageHeader
          title="Bookings"
          titleClassName={isCalendarView ? "text-2xl" : undefined}
          description={
            isCalendarView
              ? "Tap a day for schedule details. Use List for search and filters."
              : "Calendar for daily capacity, closures, and upcoming visits. List view supports search and filters."
          }
        />

        {migrationHint ? (
          <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground">
            {migrationHint}
          </div>
        ) : null}
      </div>

      <Tabs
        defaultValue="calendar"
        value={activeView}
        onValueChange={updateView}
        className={cn("min-w-0", isCalendarView && "flex min-h-0 flex-1 flex-col")}
      >
        <TabsList className="shrink-0">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="list" count={calendarBookings.length || undefined}>
            List
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="calendar"
          className={cn(
            isCalendarView
              ? "mt-0 flex min-h-0 flex-1 flex-col space-y-0 overflow-hidden pt-3"
              : "mt-6",
          )}
        >
          <BookingsCalendarView calendar={calendar} />
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <BookingsListPanel
            bookings={bookings}
            search={search}
            status={status}
            page={page}
            branch={branch}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
