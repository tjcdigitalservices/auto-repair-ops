import { StaffPageView } from "@/features/staff/components/staff-page-view";
import type { StaffRole } from "@/features/staff/types";
import { listStaff } from "@/features/staff/queries/staff-queries";

export const dynamic = "force-dynamic";

type StaffPageProps = {
  searchParams: Promise<{
    search?: string;
    role?: StaffRole;
    page?: string;
  }>;
};

export default async function StaffPage({ searchParams }: StaffPageProps) {
  const { search = "", role = "", page } = await searchParams;
  const staff = await listStaff({ search, role: role || undefined });

  return <StaffPageView staff={staff} search={search} role={role} page={page} />;
}
