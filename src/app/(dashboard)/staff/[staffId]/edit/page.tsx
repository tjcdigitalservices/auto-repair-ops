import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { StaffForm } from "@/features/staff/components/staff-form";
import { mapStaffRowToFormValues } from "@/features/staff/mappers";
import { getStaffById } from "@/features/staff/queries/staff-queries";
import {
  getPortalUsernameForLinkedUser,
  resolveMechanicPortalEmailDomain,
} from "@/features/staff/services/mechanic-portal-login";
import { getBranchScopedServerClient } from "@/lib/branches";
import { requireStaffCapability } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type EditStaffPageProps = {
  params: Promise<{
    staffId: string;
  }>;
};

export default async function EditStaffPage({ params }: EditStaffPageProps) {
  await requireStaffCapability("staff:write");

  const { staffId } = await params;
  const [{ branchScope, supabase }, staff] = await Promise.all([
    getBranchScopedServerClient("staff:write"),
    getStaffById(staffId),
  ]);

  if (!staff) {
    notFound();
  }

  const [portalEmailDomain, portalUsername] = await Promise.all([
    resolveMechanicPortalEmailDomain(supabase, branchScope.tenantId),
    staff.role === "mechanic"
      ? getPortalUsernameForLinkedUser(staff.linked_user_id)
      : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${staff.first_name} ${staff.last_name}`}
        description="Keep personnel data clean so later attendance and assignment logic has stable inputs."
      />
      <StaffForm
        mode="edit"
        portalEmailDomain={portalEmailDomain}
        initialValues={{
          ...mapStaffRowToFormValues(staff),
          portalUsername,
        }}
      />
    </div>
  );
}
