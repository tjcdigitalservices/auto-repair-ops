import type { ResolvedTenantBranding } from "@/lib/branding/types";

export type SettingsDocumentSequenceKey =
  | "quotation"
  | "job_order"
  | "invoice"
  | "sale";

export type SettingsDocumentSequence = {
  key: SettingsDocumentSequenceKey;
  label: string;
  prefix: string;
  padding: number;
  lastValue: number;
};

export type BusinessSettingsValues = {
  businessName: string;
  businessLogoUrl: string | null;
  businessMarkUrl: string | null;
  businessAddress: string;
  businessContact: string;
  businessEmail: string;
  businessVatRegistrationNo: string;
  receiptFooter: string;
  defaultTaxRate: string;
  allowGlobalProductCatalog: boolean;
  allowGlobalServiceCatalog: boolean;
  allowPartialPayments: boolean;
  requireInvoiceBeforeJobCompletion: boolean;
  requireInvoiceBeforeVehicleRelease: boolean;
  allowReleaseWithBalance: boolean;
  requireFullPaymentBeforeRelease: boolean;
  requireAdditionalItemPreApproval: boolean;
  enableBarcodeSupport: boolean;
  enableShelfLocation: boolean;
  payrollStandardDailyHours: string;
  payrollHolidayPremiumRate: string;
};

export type PublicPresenceSettingsValues = {
  websiteUrl: string;
  facebookUrl: string;
  facebookLabel: string;
  storeHours: Record<string, string>;
};

export type ThemePalettePreview = {
  primaryColor: string;
  accentColor: string;
  candidates: Array<{
    hsl: string;
    label: string;
  }>;
};

export type BusinessBranding = {
  businessName: string;
  businessLogoUrl: string | null;
  businessMarkUrl: string | null;
};

export type SettingsPageData = {
  branchName: string;
  settings: BusinessSettingsValues;
  publicPresence: PublicPresenceSettingsValues;
  themePalette: ThemePalettePreview;
  documentSequences: SettingsDocumentSequence[];
};

export const SETTINGS_PAGE_TABS = [
  "profile",
  "branches",
  "operations",
  "theme",
  "presence",
  "documents",
] as const;

export type SettingsPageTab = (typeof SETTINGS_PAGE_TABS)[number];

export type SettingsTabPageData =
  | {
      tab: "profile";
      settings: BusinessSettingsValues;
    }
  | {
      tab: "branches";
      branches: Array<{
        id: string;
        name: string;
        code: string;
        isMain: boolean;
      }>;
      selectedBranchId: string;
      canSwitch: boolean;
      canManageBranches: boolean;
      canEditTenantBranding: boolean;
      branding: ResolvedTenantBranding;
    }
  | {
      tab: "operations";
      settings: BusinessSettingsValues;
    }
  | {
      tab: "theme";
      themePalette: ThemePalettePreview;
    }
  | {
      tab: "presence";
      publicPresence: PublicPresenceSettingsValues;
    }
  | {
      tab: "documents";
      documentSequences: SettingsDocumentSequence[];
    };
