import { TimekeepingCalendarPageContent } from "@/features/attendance/components/timekeeping-calendar-page-content";
import { getTimekeepingCalendarPageData } from "@/features/attendance/queries/timekeeping-queries";
import { getBranchScope, getPageBranchSelectorProps } from "@/lib/branches";

export const dynamic = "force-dynamic";

export default async function TimekeepingSettingsPage() {
  const [data, branchSelector] = await Promise.all([
    getTimekeepingCalendarPageData(),
    getBranchScope().then(getPageBranchSelectorProps),
  ]);

  return <TimekeepingCalendarPageContent data={data} branchSelector={branchSelector} />;
}
