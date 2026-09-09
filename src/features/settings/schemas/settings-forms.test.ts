import { describe, expect, it } from "vitest";

import {
  businessProfileSettingsSchema,
  documentSequenceSettingsSchema,
  operationalRulesSettingsSchema,
  publicPresenceSettingsSchema,
  themeColorsSettingsSchema,
} from "@/features/settings/schemas/settings-forms";

describe("settings form schemas", () => {
  it("rejects empty business names", () => {
    const parsed = businessProfileSettingsSchema.safeParse({
      businessName: "",
      businessAddress: "",
      businessContact: "",
      businessEmail: "",
      businessVatRegistrationNo: "",
      receiptFooter: "",
      defaultTaxRate: "12",
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts optional public presence URLs", () => {
    const parsed = publicPresenceSettingsSchema.safeParse({
      websiteUrl: "https://example.com",
      facebookUrl: "https://www.facebook.com/example",
      facebookLabel: "Example Shop",
      storeHoursMonday: "7:00 AM – 5:00 PM",
      storeHoursTuesday: "7:00 AM – 5:00 PM",
      storeHoursWednesday: "7:00 AM – 5:00 PM",
      storeHoursThursday: "7:00 AM – 5:00 PM",
      storeHoursFriday: "7:00 AM – 5:00 PM",
      storeHoursSaturday: "8:00 AM – 12:00 PM",
      storeHoursSunday: "",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid public presence URLs", () => {
    const parsed = publicPresenceSettingsSchema.safeParse({
      websiteUrl: "not-a-url",
      facebookUrl: "",
      facebookLabel: "",
      storeHoursMonday: "",
      storeHoursTuesday: "",
      storeHoursWednesday: "",
      storeHoursThursday: "",
      storeHoursFriday: "",
      storeHoursSaturday: "",
      storeHoursSunday: "",
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts theme color selections", () => {
    const parsed = themeColorsSettingsSchema.safeParse({
      buttonColor: "215 90% 47%",
      accentColor: "39 90% 50%",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects identical button and accent colors", () => {
    const parsed = themeColorsSettingsSchema.safeParse({
      buttonColor: "215 90% 47%",
      accentColor: "215 90% 47%",
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts operational rule toggles", () => {
    const parsed = operationalRulesSettingsSchema.safeParse({
      allowGlobalProductCatalog: false,
      allowGlobalServiceCatalog: true,
      allowPartialPayments: true,
      requireInvoiceBeforeJobCompletion: false,
      requireInvoiceBeforeVehicleRelease: false,
      allowReleaseWithBalance: false,
      requireFullPaymentBeforeRelease: true,
      requireAdditionalItemPreApproval: true,
      enableBarcodeSupport: true,
      enableShelfLocation: false,
      payrollStandardDailyHours: "8",
      payrollHolidayPremiumRate: "30",
      payrollDefaultSssAmount: "450",
      payrollDefaultPhilhealthAmount: "400",
      payrollDefaultPagibigAmount: "100",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid payroll rule settings", () => {
    const parsed = operationalRulesSettingsSchema.safeParse({
      allowGlobalProductCatalog: false,
      allowGlobalServiceCatalog: true,
      allowPartialPayments: true,
      requireInvoiceBeforeJobCompletion: false,
      requireInvoiceBeforeVehicleRelease: false,
      allowReleaseWithBalance: false,
      requireFullPaymentBeforeRelease: true,
      requireAdditionalItemPreApproval: true,
      enableBarcodeSupport: true,
      enableShelfLocation: false,
      payrollStandardDailyHours: "0",
      payrollHolidayPremiumRate: "-5",
      payrollDefaultSssAmount: "-1",
      payrollDefaultPhilhealthAmount: "400",
      payrollDefaultPagibigAmount: "100",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects invalid document sequence padding", () => {
    const parsed = documentSequenceSettingsSchema.safeParse({
      key: "invoice",
      prefix: "INV-",
      padding: "0",
      lastValue: "10",
    });

    expect(parsed.success).toBe(false);
  });
});
