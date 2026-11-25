import type { TenantStatus } from "@/lib/tenants/status";

export type PlatformTenantListItem = {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  planKey: string;
  trialEndsAt: string | null;
  createdAt: string;
};

export type TenantStatusFilter = "all" | TenantStatus;
export type TenantSortOrder = "newest" | "oldest";

export const PLATFORM_TENANT_TABS = [
  "overview",
  "users",
  "branches",
  "subscription",
  "activity",
] as const;

export type PlatformTenantTab = (typeof PLATFORM_TENANT_TABS)[number];

export type PlatformTenantBranchItem = {
  id: string;
  code: string;
  name: string;
  address: string | null;
  contactNumber: string | null;
  email: string | null;
  isMain: boolean;
  isActive: boolean;
  status: string;
};

export type PlatformTenantUserItem = {
  id: string;
  fullName: string;
  email: string | null;
  role: string;
  status: string;
  updatedAt: string;
  isOwner: boolean;
  hasLinkedAccount: boolean;
};

export type PlatformTenantOwnerInfo = {
  staffId: string;
  fullName: string;
  email: string | null;
  status: string;
  hasLinkedAccount: boolean;
} | null;

export type PlatformTenantActivityItem = {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
  actorEmail: string | null;
  summary: string;
};

export type PlatformTenantBrandingSummary = {
  appName: string;
  companyName: string;
  logoSrc: string;
  publicPath: string;
};

export type PlatformTenantWorkspaceData = {
  tenant: {
    id: string;
    name: string;
    slug: string;
    status: TenantStatus;
    planKey: string;
    trialEndsAt: string | null;
    billingCustomerId: string | null;
    currencyCode: string;
    timezone: string;
    createdAt: string;
    updatedAt: string;
  };
  branding: PlatformTenantBrandingSummary;
  branches: PlatformTenantBranchItem[];
  users: PlatformTenantUserItem[];
  owner: PlatformTenantOwnerInfo;
  activity: PlatformTenantActivityItem[];
};