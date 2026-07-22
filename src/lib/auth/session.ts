import { cache } from "react";
import { redirect } from "next/navigation";

import { isMissingStaffDocumentTitleColumnError } from "@/features/staff/document-title-compat";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isTenantOperable } from "@/lib/tenants/status";
import type { TableRow } from "@/types/database";
import {
  getRoleCapabilities,
  hasCapability,
  type AppCapability,
  type StaffRole,
} from "@/lib/auth/permissions";

type StaffRow = TableRow<"staff">;
type PlatformAdminRole = TableRow<"platform_admins">["role"];

export type AuthenticatedStaffContext = {
  kind: "staff";
  userId: string;
  email: string | null;
  staffId: string;
  tenantId: string;
  role: StaffRole;
  displayName: string;
  documentTitle: string | null;
  branchId: string | null;
  capabilities: readonly AppCapability[];
};

export type PlatformAdminContext = {
  kind: "platform";
  userId: string;
  email: string | null;
  role: PlatformAdminRole;
  displayName: string;
};

export type AuthenticatedContext = AuthenticatedStaffContext | PlatformAdminContext;

export type AppSessionState =
  | {
      status: "anonymous";
    }
  | {
      status: "inactive";
      userId: string;
      email: string | null;
    }
  | {
      status: "tenant_suspended";
      userId: string;
      email: string | null;
    }
  | {
      status: "authenticated";
      context: AuthenticatedContext;
    };

export const getAppSessionState = cache(async (): Promise<AppSessionState> => {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { status: "anonymous" };
  }

  const { data: platformAdmin } = await supabase
    .from("platform_admins")
    .select("user_id, role, display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (platformAdmin) {
    return {
      status: "authenticated",
      context: {
        kind: "platform",
        userId: user.id,
        email: user.email ?? null,
        role: platformAdmin.role,
        displayName:
          platformAdmin.display_name?.trim() ||
          user.email ||
          "Platform Admin",
      },
    };
  }

  const { data: staffWithDocumentTitle, error: staffWithDocumentTitleError } = await supabase
    .from("staff")
    .select("id, first_name, last_name, document_title, branch_id, tenant_id, role, status")
    .eq("linked_user_id", user.id)
    .maybeSingle();

  let staff = staffWithDocumentTitle;

  if (staffWithDocumentTitleError) {
    if (!isMissingStaffDocumentTitleColumnError(staffWithDocumentTitleError)) {
      throw new Error(staffWithDocumentTitleError.message);
    }

    const { data: fallbackStaff, error: fallbackStaffError } = await supabase
      .from("staff")
      .select("id, first_name, last_name, branch_id, tenant_id, role, status")
      .eq("linked_user_id", user.id)
      .maybeSingle();

    if (fallbackStaffError) {
      throw new Error(fallbackStaffError.message);
    }

    staff = fallbackStaff
      ? {
          ...fallbackStaff,
          document_title: null,
        }
      : null;
  }

  if (!staff || staff.status !== "active") {
    return {
      status: "inactive",
      userId: user.id,
      email: user.email ?? null,
    };
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("status")
    .eq("id", staff.tenant_id)
    .maybeSingle();

  if (!tenant || !isTenantOperable(tenant.status)) {
    return {
      status: "tenant_suspended",
      userId: user.id,
      email: user.email ?? null,
    };
  }

  return {
    status: "authenticated",
    context: mapStaffContext(user.id, user.email ?? null, staff),
  };
});

export async function requireAuthenticatedStaff() {
  const session = await getAppSessionState();

  if (session.status === "anonymous") {
    redirect("/login");
  }

  if (session.status === "inactive") {
    redirect("/login?reason=inactive");
  }

  if (session.status === "tenant_suspended") {
    redirect("/login?reason=tenant_suspended");
  }

  if (session.context.kind !== "staff") {
    redirect("/platform");
  }

  return session.context;
}

export async function requirePlatformAdmin() {
  const session = await getAppSessionState();

  if (session.status === "anonymous") {
    redirect("/login");
  }

  if (session.status !== "authenticated" || session.context.kind !== "platform") {
    redirect("/forbidden");
  }

  return session.context;
}

export async function requireStaffCapability(capability: AppCapability) {
  const context = await requireAuthenticatedStaff();

  if (!hasCapability(context.role, capability)) {
    redirect("/forbidden");
  }

  return context;
}

export async function getAuthorizedSupabaseServerClient(capability: AppCapability) {
  return getAuthorizedSupabaseServerClientCached(capability);
}

const getAuthorizedSupabaseServerClientCached = cache(
  async (capability: AppCapability) => {
    const context = await requireStaffCapability(capability);
    const supabase = await getSupabaseServerClient();

    return { context, supabase };
  },
);

function mapStaffContext(
  userId: string,
  email: string | null,
  staff: Pick<
    StaffRow,
    "id" | "first_name" | "last_name" | "document_title" | "branch_id" | "tenant_id" | "role"
  >,
): AuthenticatedStaffContext {
  return {
    kind: "staff",
    userId,
    email,
    staffId: staff.id,
    tenantId: staff.tenant_id,
    role: staff.role,
    displayName: `${staff.first_name} ${staff.last_name}`.trim(),
    documentTitle: staff.document_title,
    branchId: staff.branch_id,
    capabilities: getRoleCapabilities(staff.role),
  };
}
