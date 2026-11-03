import {
  dtrAmendmentFormSchema,
  dtrAmendmentReviewSchema,
  parseDtrAmendmentFormData,
  parseDtrAmendmentReviewFormData,
} from "@/features/attendance/schemas/dtr-amendment-schema";
import {
  attendanceEntrySchema,
  parseAttendanceEntryFormData,
} from "@/features/attendance/schemas/attendance-form-schema";
import {
  parseStaffScheduleFormData,
  staffScheduleSchema,
} from "@/features/attendance/schemas/staff-schedule-schema";
import {
  inventoryMovementSchema,
  parseInventoryMovementFormData,
  parseUpdateInventoryStockSettingsFormData,
  updateInventoryStockSettingsSchema,
} from "@/features/inventory/schemas/inventory-forms";
import {
  completePosSaleSchema,
  parseCompletePosSaleFormData,
} from "@/features/pos/schemas/pos-form-schema";
import {
  cancelInvoiceSchema,
  createInvoiceFromJobOrderSchema,
  parseCancelInvoiceFormData,
  parseCreateInvoiceFromJobOrderFormData,
  parseRecordInvoicePaymentFormData,
  parseReleaseJobOrderVehicleFormData,
  recordInvoicePaymentSchema,
  releaseJobOrderVehicleSchema,
} from "@/features/invoices/schemas/invoice-forms";
import {
  additionalJobOrderItemSchema,
  jobOrderChecklistStateSchema,
  jobOrderDetailsSchema,
  jobOrderItemEditSchema,
  jobOrderPartUsageSchema,
  jobOrderStatusTransitionSchema,
  mechanicAssignmentSchema,
  parseAdditionalJobOrderItemFormData,
  parseJobOrderChecklistStateFormData,
  parseJobOrderDetailsFormData,
  parseJobOrderItemEditFormData,
  parseJobOrderPartUsageFormData,
  parseJobOrderStatusTransitionFormData,
  parseMechanicAssignmentFormData,
} from "@/features/job-orders/schemas/job-order-forms";
import type { InlineProductActionState } from "@/features/products/inline-product-action-state";
import {
  attendanceAccessSettingsSchema,
  attendanceAllowedIpSchema,
  parseAttendanceAccessSettingsFormData,
  parseAttendanceAllowedIpFormData,
} from "@/features/attendance/schemas/attendance-settings-schema";
import {
  branchHolidaySchema,
  parseBranchHolidayFormData,
  parsePhilippineHolidayImportFormData,
  philippineHolidayImportSchema,
} from "@/features/attendance/schemas/branch-holiday-schema";
import {
  getPhilippineHolidaySuggestionsForYear,
  isPhilippineHolidaySuggestionImportable,
} from "@/features/attendance/philippine-holidays";
import type { AttendanceEntryActionState, TimekeepingActionState } from "@/features/attendance/types";
import {
  customerFormSchema,
  parseCustomerFormData,
} from "@/features/customers/schemas/customer-form-schema";
import type { FormActionState } from "@/lib/forms";
import { toFormActionState } from "@/lib/forms";
import type { PayrollFormActionState } from "@/features/payroll/types";
import {
  compensationProfileSchema,
  parseCompensationProfileFormData,
  parsePayrollAdjustmentFormData,
  parsePayrollPeriodFormData,
  parsePayrollPeriodStatusFormData,
  payrollAdjustmentSchema,
  payrollPeriodSchema,
  payrollPeriodStatusSchema,
} from "@/features/payroll/schemas/payroll-schemas";
import {
  deleteSandboxPayrollAdjustment,
  saveSandboxCompensationProfile,
  saveSandboxPayrollAdjustment,
  updateSandboxPayrollPeriodStatus,
} from "@/features/sandbox/payroll";
import { productFormSchema, parseProductFormData } from "@/features/products/schemas/product-form-schema";
import { serviceFormSchema, parseServiceFormData } from "@/features/services/schemas/service-form-schema";
import { staffFormSchema, parseStaffFormData } from "@/features/staff/schemas/staff-form-schema";
import type { StaffActionState } from "@/features/staff/types";
import { supplierFormSchema, parseSupplierFormData } from "@/features/suppliers/schemas/supplier-form-schema";
import { vehicleFormSchema, parseVehicleFormData } from "@/features/vehicles/schemas/vehicle-form-schema";
import {
  parseVehicleLookupOptionFormData,
  parseVehicleMakeFormData,
  parseVehicleModelFormData,
  vehicleLookupOptionFormSchema,
  vehicleMakeFormSchema,
  vehicleModelFormSchema,
} from "@/features/vehicles/schemas/vehicle-lookup-schemas";
import type { VehicleStatus } from "@/features/vehicles/types";
import {
  businessProfileSettingsSchema,
  documentSequenceSettingsSchema,
  operationalRulesSettingsSchema,
  parseBusinessProfileSettingsFormData,
  parseDocumentSequenceSettingsFormData,
  parseOperationalRulesSettingsFormData,
  parsePublicPresenceSettingsFormData,
  parseThemeColorsSettingsFormData,
  publicPresenceSettingsSchema,
  themeColorsSettingsSchema,
} from "@/features/settings/schemas/settings-forms";
import {
  STORE_HOUR_DAY_NAMES,
  storeHourFieldName,
} from "@/features/settings/store-hours.shared";
import type { InlineCustomerCreateActionState } from "@/features/customers/inline-customer-action-state";
import {
  parseQuotationFormData,
  quotationFormSchema,
} from "@/features/quotations/schemas/quotation-form-schema";
import {
  parseQuotationReviseFormData,
  quotationReviseFormSchema,
} from "@/features/quotations/schemas/quotation-revise-schema";
import type { QuotationVehicleOption } from "@/features/quotations/types";
import type { SaveDocumentInput, SaveDocumentResult } from "@/components/document-engine/persistence/types";
import {
  approveQuotationRecord,
  createPayrollPeriodRecord,
  deleteCustomerRecord,
  archiveSandboxDocumentRecord,
  deleteSandboxDocumentRecord,
  duplicateSandboxDocumentRecord,
  reviseSandboxDocumentRecord,
  saveSandboxDocumentRecord,
  deleteQuotationRecord,
  generatePayrollCutRecord,
  rejectQuotationRecord,
  reviseQuotationRecord,
  ensureSandboxShopSettings,
  saveBusinessProfile,
  saveCustomerRecord,
  saveSandboxDocumentSequence,
  saveSandboxOperationalRules,
  saveSandboxPublicPresence,
  saveSandboxThemeColors,
  saveProductRecord,
  saveQuotationFromForm,
  saveServiceRecord,
  saveStaffRecord,
  addJobOrderItemRecord,
  assignMechanicRecord,
  cancelInvoiceRecord,
  createInvoiceFromJobOrderRecord,
  deleteJobOrderRecord,
  recordJobOrderPartMovementRecord,
  recordPaymentRecord,
  releaseJobOrderVehicleRecord,
  removeMechanicRecord,
  saveJobOrderDetailsRecord,
  saveStaffScheduleRecord,
  setJobOrderChecklistRecord,
  setJobOrderItemApprovalRecord,
  updateJobOrderItemRecord,
  updateJobOrderStatusRecord,
  addSandboxAllowedIp,
  applySandboxInventoryMovement,
  completePosCartRecord,
  approveSandboxStaffDevice,
  deleteSandboxAllowedIp,
  deleteSandboxHoliday,
  deleteSandboxStaffDevice,
  importSandboxHolidays,
  revokeSandboxStaffDevice,
  saveSandboxAttendanceAccess,
  recordSandboxMechanicPunch,
  reviewSandboxDtrAmendment,
  submitSandboxDtrAmendment,
  saveSupplierRecord,
  createVehicleLookupOptionRecord,
  createVehicleMakeRecord,
  createVehicleModelRecord,
  deleteVehicleMakeRecord,
  deleteVehicleModelRecord,
  deleteVehicleRecord,
  saveVehicleRecord,
  updateSandboxInventorySettings,
  updateVehicleLookupOptionStatusRecord,
  updateVehicleMakeStatusRecord,
  updateVehicleModelStatusRecord,
  upsertAttendanceRecord,
  upsertSandboxHoliday,
} from "@/features/sandbox/records";
import { readSandboxShop, updateSandboxShop } from "@/features/sandbox/store";
import { toUtcIso } from "@/lib/dates";

function go(path: string) {
  window.location.assign(path);
}

function loadingError(): FormActionState {
  return { status: "error", message: "The sample shop is still loading." };
}

export async function saveSandboxCustomerAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return loadingError();

  const parsed = customerFormSchema.safeParse(parseCustomerFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  try {
    const result = saveCustomerRecord(snapshot, parsed.data);
    await updateSandboxShop(() => result.snapshot);
    go(`/customers/${result.id}`);
    return { status: "success" };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Could not save the customer." };
  }
}

export async function deleteSandboxCustomerAction(formData: FormData) {
  const customerId = String(formData.get("customerId") ?? "");
  const snapshot = readSandboxShop();
  if (!snapshot) {
    go("/customers?error=The%20sample%20shop%20is%20still%20loading.");
    return;
  }

  const result = deleteCustomerRecord(snapshot, customerId);
  if (!result.ok) {
    go(`/customers?error=${encodeURIComponent(result.message)}`);
    return;
  }

  await updateSandboxShop(() => result.snapshot);
  go("/customers");
}

export async function deleteSandboxVehicleAction(formData: FormData) {
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const snapshot = readSandboxShop();
  if (!snapshot) {
    go("/vehicles?error=The%20sample%20shop%20is%20still%20loading.");
    return;
  }

  const result = deleteVehicleRecord(snapshot, vehicleId);
  if (!result.ok) {
    go(`/vehicles?error=${encodeURIComponent(result.message)}`);
    return;
  }

  await updateSandboxShop(() => result.snapshot);
  go("/vehicles");
}

export async function saveSandboxVehicleAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return loadingError();

  const parsed = vehicleFormSchema.safeParse(parseVehicleFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  try {
    const result = saveVehicleRecord(snapshot, parsed.data);
    await updateSandboxShop(() => result.snapshot);
    go(`/customers/${result.customerId}`);
    return { status: "success" };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Could not save the vehicle." };
  }
}

export async function saveSandboxProductAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return loadingError();

  const parsed = productFormSchema.safeParse(parseProductFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  try {
    const imageUrl = await readImageField(formData, "productImage");
    const result = saveProductRecord(snapshot, parsed.data, new Date(), imageUrl);
    await updateSandboxShop(() => result.snapshot);
    go("/products");
    return { status: "success" };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Could not save the product." };
  }
}

export async function saveSandboxServiceAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return loadingError();

  const parsed = serviceFormSchema.safeParse(parseServiceFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  const result = saveServiceRecord(snapshot, parsed.data);
  await updateSandboxShop(() => result.snapshot);
  go("/services");
  return { status: "success" };
}

export async function saveSandboxSupplierAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return loadingError();

  const parsed = supplierFormSchema.safeParse(parseSupplierFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  const result = saveSupplierRecord(snapshot, parsed.data);
  await updateSandboxShop(() => result.snapshot);
  go("/suppliers");
  return { status: "success" };
}

export async function saveSandboxStaffAction(
  _previous: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return { status: "error", message: "The sample shop is still loading." };

  const parsed = staffFormSchema.safeParse(parseStaffFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  const result = saveStaffRecord(snapshot, { ...parseStaffFormData(formData), ...parsed.data });
  await updateSandboxShop(() => result.snapshot);
  go("/staff");
  return { status: "success" };
}

export async function saveSandboxBusinessProfileAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return loadingError();

  const parsed = businessProfileSettingsSchema.safeParse(parseBusinessProfileSettingsFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  const logoDataUrl = await readImageField(formData, "businessLogo");
  const markDataUrl = await readImageField(formData, "businessMark");
  const next = saveBusinessProfile(snapshot, {
    name: parsed.data.businessName,
    address: parsed.data.businessAddress,
    contact: parsed.data.businessContact,
    email: parsed.data.businessEmail,
    vatRegistrationNo: parsed.data.businessVatRegistrationNo,
    receiptFooter: parsed.data.receiptFooter,
    defaultTaxRate: parsed.data.defaultTaxRate,
    logoDataUrl: logoDataUrl ?? snapshot.business.logoDataUrl,
    markDataUrl: markDataUrl ?? snapshot.business.markDataUrl,
  });
  await updateSandboxShop(() => next);
  go("/settings");
  return { status: "success" };
}

export async function saveSandboxOperationalRulesAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return loadingError();

  const parsed = operationalRulesSettingsSchema.safeParse(parseOperationalRulesSettingsFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  const next = saveSandboxOperationalRules(snapshot, {
    ...parsed.data,
    payrollHolidayPremiumRate: String(Number(parsed.data.payrollHolidayPremiumRate) / 100),
  });
  await updateSandboxShop(() => next);
  go("/settings?tab=operations");
  return { status: "success", message: "Operational rules saved." };
}

export async function saveSandboxThemeColorsAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return loadingError();

  const parsed = themeColorsSettingsSchema.safeParse(parseThemeColorsSettingsFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  const next = saveSandboxThemeColors(ensureSandboxShopSettings(snapshot), {
    themePrimaryColor: parsed.data.buttonColor,
    themeAccentColor: parsed.data.accentColor,
  });
  await updateSandboxShop(() => next);
  go("/settings?tab=theme");
  return { status: "success", message: "Theme colors saved." };
}

export async function saveSandboxPublicPresenceAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return loadingError();

  const parsed = publicPresenceSettingsSchema.safeParse(parsePublicPresenceSettingsFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  const presenceValues = parsed.data as Record<string, string>;
  const storeHours = Object.fromEntries(
    STORE_HOUR_DAY_NAMES.map((day) => [
      storeHourFieldName(day),
      presenceValues[storeHourFieldName(day)] ?? "",
    ]),
  );

  const next = saveSandboxPublicPresence(ensureSandboxShopSettings(snapshot), {
    websiteUrl: parsed.data.websiteUrl,
    facebookUrl: parsed.data.facebookUrl,
    facebookLabel: parsed.data.facebookLabel,
    storeHours,
  });
  await updateSandboxShop(() => next);
  go("/settings?tab=presence");
  return { status: "success", message: "Public presence saved." };
}

export async function saveSandboxDocumentSequenceAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return loadingError();

  const parsed = documentSequenceSettingsSchema.safeParse(parseDocumentSequenceSettingsFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  const next = saveSandboxDocumentSequence(ensureSandboxShopSettings(snapshot), {
    key: parsed.data.key,
    prefix: parsed.data.prefix,
    padding: Number(parsed.data.padding),
    lastValue: Number(parsed.data.lastValue),
  });
  await updateSandboxShop(() => next);
  go("/settings?tab=documents");
  return { status: "success", message: "Document sequence saved." };
}

export async function saveSandboxAttendanceAction(
  _previous: AttendanceEntryActionState,
  formData: FormData,
): Promise<AttendanceEntryActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return { status: "error", message: "The sample shop is still loading." };

  const parsed = attendanceEntrySchema.safeParse(parseAttendanceEntryFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  try {
    const next = upsertAttendanceRecord(snapshot, {
      staffId: parsed.data.staffId,
      attendanceDate: parsed.data.attendanceDate,
      status: parsed.data.status,
      timeIn: parsed.data.timeIn ? toUtcIso(parsed.data.timeIn) : null,
      timeOut: parsed.data.timeOut ? toUtcIso(parsed.data.timeOut) : null,
      notes: parsed.data.notes || null,
    });
    await updateSandboxShop(() => next);
    return { status: "success" };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Could not save attendance." };
  }
}

export async function saveSandboxStaffScheduleAction(
  _previous: AttendanceEntryActionState,
  formData: FormData,
): Promise<AttendanceEntryActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return { status: "error", message: "The sample shop is still loading." };

  const parsed = staffScheduleSchema.safeParse(parseStaffScheduleFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  try {
    const next = saveStaffScheduleRecord(snapshot, {
      staffId: parsed.data.staffId,
      shiftStartTime: parsed.data.shiftStartTime,
      shiftEndTime: parsed.data.shiftEndTime,
      graceMinutes: Number(parsed.data.graceMinutes),
      mondayIsWorkday: parsed.data.mondayIsWorkday,
      tuesdayIsWorkday: parsed.data.tuesdayIsWorkday,
      wednesdayIsWorkday: parsed.data.wednesdayIsWorkday,
      thursdayIsWorkday: parsed.data.thursdayIsWorkday,
      fridayIsWorkday: parsed.data.fridayIsWorkday,
      saturdayIsWorkday: parsed.data.saturdayIsWorkday,
      sundayIsWorkday: parsed.data.sundayIsWorkday,
      notes: parsed.data.notes || null,
    });
    await updateSandboxShop(() => next);
    return { status: "success" };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Could not save the schedule." };
  }
}

export async function saveSandboxQuotationAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return loadingError();

  const parsed = quotationFormSchema.safeParse(parseQuotationFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  try {
    const result = saveQuotationFromForm(snapshot, parsed.data);
    await updateSandboxShop(() => result.snapshot);
    go(`/quotations/${result.id}`);
    return { status: "success" };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Could not save the quotation." };
  }
}

export async function reviseSandboxQuotationAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return loadingError();

  const parsed = quotationReviseFormSchema.safeParse(parseQuotationReviseFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  try {
    const result = reviseQuotationRecord(snapshot, parsed.data);
    await updateSandboxShop(() => result.snapshot);
    go(`/quotations/${result.id}`);
    return { status: "success" };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Could not revise the quotation." };
  }
}

export async function approveSandboxQuotationAction(formData: FormData) {
  const quotationId = String(formData.get("quotationId") ?? "");
  const snapshot = readSandboxShop();
  if (!snapshot) return;

  await updateSandboxShop((current) => approveQuotationRecord(current, quotationId));
  go(`/quotations/${quotationId}`);
}

export async function rejectSandboxQuotationAction(formData: FormData) {
  const quotationId = String(formData.get("quotationId") ?? "");
  const snapshot = readSandboxShop();
  if (!snapshot) return;

  const next = rejectQuotationRecord(snapshot, quotationId);
  await updateSandboxShop(() => next);
  go(`/quotations/${quotationId}`);
}

export async function deleteSandboxQuotationAction(formData: FormData) {
  const quotationId = String(formData.get("quotationId") ?? "");
  const snapshot = readSandboxShop();
  if (!snapshot) {
    go("/quotations?error=The%20sample%20shop%20is%20still%20loading.");
    return;
  }

  const result = deleteQuotationRecord(snapshot, quotationId);
  if (!result.ok) {
    go(`/quotations?error=${encodeURIComponent(result.message)}`);
    return;
  }

  await updateSandboxShop(() => result.snapshot);
  go("/quotations");
}

export async function quickCreateSandboxCustomerForQuotationAction(
  _previous: InlineCustomerCreateActionState,
  formData: FormData,
): Promise<InlineCustomerCreateActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return { status: "error", message: "The sample shop is still loading." };

  const parsed = customerFormSchema.safeParse(parseCustomerFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  try {
    const result = saveCustomerRecord(snapshot, parsed.data);
    await updateSandboxShop(() => result.snapshot);
    const customer = result.snapshot.customers.find((item) => item.id === result.id);
    return {
      status: "success",
      message: `${customer?.displayName ?? "Customer"} is ready for quotation intake.`,
      data: { id: result.id, label: customer?.displayName ?? "Customer" },
    };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Could not save the customer." };
  }
}

export async function quickCreateSandboxVehicleForQuotationAction(
  _previous: { status: "idle" | "error" | "success"; message?: string; fieldErrors?: Record<string, string[] | undefined>; data?: QuotationVehicleOption },
  formData: FormData,
): Promise<{ status: "idle" | "error" | "success"; message?: string; fieldErrors?: Record<string, string[] | undefined>; data?: QuotationVehicleOption }> {
  const snapshot = readSandboxShop();
  if (!snapshot) return { status: "error", message: "The sample shop is still loading." };

  const parsed = vehicleFormSchema.safeParse(parseVehicleFormData(formData));
  if (!parsed.success) return { ...toFormActionState(parsed.error), status: "error" };

  const plate = parsed.data.plateNumber.trim().toUpperCase();
  const vin = parsed.data.vin.trim().toUpperCase();
  if (plate && snapshot.vehicles.some((item) => item.plateNumber?.toUpperCase() === plate)) {
    return {
      status: "error",
      message: "A vehicle with this plate number already exists.",
      fieldErrors: { plateNumber: ["A vehicle with this plate number already exists."] },
    };
  }
  if (vin && snapshot.vehicles.some((item) => item.vin?.toUpperCase() === vin)) {
    return {
      status: "error",
      message: "A vehicle with this VIN already exists.",
      fieldErrors: { vin: ["A vehicle with this VIN already exists."] },
    };
  }

  try {
    const result = saveVehicleRecord(snapshot, parsed.data);
    await updateSandboxShop(() => result.snapshot);
    const vehicle = result.snapshot.vehicles.find((item) => item.id === result.id);
    const yearPart = vehicle?.year ? ` (${vehicle.year})` : "";
    const platePart = vehicle?.plateNumber ? ` · ${vehicle.plateNumber}` : "";
    return {
      status: "success",
      message: `${vehicle?.make ?? "Vehicle"} ${vehicle?.model ?? ""} is ready for quotation intake.`.trim(),
      data: {
        id: result.id,
        customerId: result.customerId,
        label: `${vehicle?.make ?? ""} ${vehicle?.model ?? ""}${yearPart}${platePart}`.trim(),
      },
    };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Could not save the vehicle." };
  }
}

export async function saveSandboxDocumentAction(input: SaveDocumentInput): Promise<SaveDocumentResult> {
  const snapshot = readSandboxShop();
  if (!snapshot) return { ok: false, message: "The sample shop is still loading." };

  const result = saveSandboxDocumentRecord(snapshot, input);
  if (!result.ok) return result;

  await updateSandboxShop(() => result.snapshot);
  return { ok: true, document: result.document };
}

export async function duplicateSandboxDocumentAction(documentId: string): Promise<SaveDocumentResult> {
  const snapshot = readSandboxShop();
  if (!snapshot) return { ok: false, message: "The sample shop is still loading." };

  const result = duplicateSandboxDocumentRecord(snapshot, documentId);
  if (!result.ok) return result;

  await updateSandboxShop(() => result.snapshot);
  return { ok: true, document: result.document };
}

export async function archiveSandboxDocumentAction(documentId: string): Promise<SaveDocumentResult> {
  const snapshot = readSandboxShop();
  if (!snapshot) return { ok: false, message: "The sample shop is still loading." };

  const result = archiveSandboxDocumentRecord(snapshot, documentId);
  if (!result.ok) return result;

  await updateSandboxShop(() => result.snapshot);
  return { ok: true, document: result.document };
}

export async function deleteSandboxDocumentAction(documentId: string) {
  const snapshot = readSandboxShop();
  if (!snapshot) {
    go("/documents");
    return;
  }

  const result = deleteSandboxDocumentRecord(snapshot, documentId);
  if (!result.ok) return;

  await updateSandboxShop(() => result.snapshot);
  go("/documents");
}

export async function reviseSandboxDocumentFormAction(formData: FormData) {
  const documentId = String(formData.get("documentId") ?? "");
  const snapshot = readSandboxShop();
  if (!snapshot || !documentId) return;

  const result = reviseSandboxDocumentRecord(snapshot, documentId);
  if (!result.ok) return;

  await updateSandboxShop(() => result.snapshot);
  go(`/documents/${result.document.id}`);
}

export async function saveSandboxBranchHolidayAction(
  _previous: TimekeepingActionState,
  formData: FormData,
): Promise<TimekeepingActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return { status: "error", message: "The sample shop is still loading." };

  const parsed = branchHolidaySchema.safeParse(parseBranchHolidayFormData(formData));
  if (!parsed.success) return { ...toFormActionState(parsed.error), status: "error" };

  const result = upsertSandboxHoliday(snapshot, parsed.data);
  if (!result.ok) return { status: "error", message: result.message };

  await updateSandboxShop(() => result.snapshot);
  return { status: "success" };
}

export async function deleteSandboxBranchHolidayAction(formData: FormData) {
  const holidayId = String(formData.get("holidayId") ?? "");
  const snapshot = readSandboxShop();
  if (!snapshot || !holidayId) return;

  await updateSandboxShop(() => deleteSandboxHoliday(snapshot, holidayId));
  go("/settings/timekeeping?tab=holidays");
}

export async function importSandboxPhilippineHolidaysAction(
  _previous: TimekeepingActionState,
  formData: FormData,
): Promise<TimekeepingActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return { status: "error", message: "The sample shop is still loading." };

  const parsed = philippineHolidayImportSchema.safeParse(parsePhilippineHolidayImportFormData(formData));
  if (!parsed.success) return { ...toFormActionState(parsed.error), status: "error" };

  const suggestions = getPhilippineHolidaySuggestionsForYear(parsed.data.year);
  if (suggestions.length === 0) {
    return { status: "error", message: `No official Philippine holiday suggestions are stored for ${parsed.data.year} yet.` };
  }

  const suggestionById = new Map(suggestions.map((suggestion) => [suggestion.id, suggestion]));
  const selected = parsed.data.selections.flatMap((selection) => {
    const suggestion = suggestionById.get(selection.suggestionId);
    if (!suggestion || !isPhilippineHolidaySuggestionImportable(suggestion)) return [];
    return [{
      holidayDate: suggestion.holidayDate,
      label: suggestion.label,
      holidayKind: suggestion.holidayKind,
      payTreatment: selection.payTreatment,
      notes: suggestion.notes,
    }];
  });

  if (selected.length === 0) {
    return { status: "error", message: "Select at least one importable holiday to continue." };
  }

  const result = importSandboxHolidays(snapshot, selected);
  await updateSandboxShop(() => result.snapshot);

  if (result.importedCount === 0) {
    return {
      status: "success",
      message: "No new holidays were imported. The selected dates already exist in this branch calendar.",
    };
  }

  return { status: "success", message: "Philippine holidays imported." };
}

export async function saveSandboxAttendanceAccessAction(
  _previous: TimekeepingActionState,
  formData: FormData,
): Promise<TimekeepingActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return { status: "error", message: "The sample shop is still loading." };

  const parsed = attendanceAccessSettingsSchema.safeParse(parseAttendanceAccessSettingsFormData(formData));
  if (!parsed.success) return { ...toFormActionState(parsed.error), status: "error" };

  await updateSandboxShop(() =>
    saveSandboxAttendanceAccess(snapshot, {
      requireShopIpForMechanicAttendance: parsed.data.requireShopIpForMechanicAttendance,
      requireShopLocationForMechanicAttendance: parsed.data.requireShopLocationForMechanicAttendance,
      allowDtrAmendments: parsed.data.allowDtrAmendments,
      allowAttendanceAdminOverride: parsed.data.allowAttendanceAdminOverride,
      geofenceLatitude: parsed.data.geofenceLatitude === null ? "" : String(parsed.data.geofenceLatitude),
      geofenceLongitude: parsed.data.geofenceLongitude === null ? "" : String(parsed.data.geofenceLongitude),
      geofenceRadiusMeters: String(parsed.data.geofenceRadiusMeters),
    }),
  );

  return { status: "success", message: "Mechanic attendance settings saved." };
}

export async function addSandboxAllowedIpAction(
  _previous: TimekeepingActionState,
  formData: FormData,
): Promise<TimekeepingActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return { status: "error", message: "The sample shop is still loading." };

  const parsed = attendanceAllowedIpSchema.safeParse(parseAttendanceAllowedIpFormData(formData));
  if (!parsed.success) return { ...toFormActionState(parsed.error), status: "error" };

  const ipAddress = parsed.data.ipAddress.trim();
  if (!ipAddress) return { status: "error", message: "Enter a valid public IP address." };

  const result = addSandboxAllowedIp(snapshot, { ipAddress, label: parsed.data.label });
  if (!result.ok) return { status: "error", message: "That shop IP is already allowed." };

  await updateSandboxShop(() => result.snapshot);
  return { status: "success", message: "Allowed shop IP added." };
}

export async function deleteSandboxAllowedIpAction(formData: FormData) {
  const allowedIpId = String(formData.get("allowedIpId") ?? "");
  const snapshot = readSandboxShop();
  if (!snapshot || !allowedIpId) return;

  await updateSandboxShop(() => deleteSandboxAllowedIp(snapshot, allowedIpId));
  go("/settings/timekeeping");
}

export async function approveSandboxStaffDeviceAction(formData: FormData) {
  const deviceId = String(formData.get("deviceId") ?? "");
  const snapshot = readSandboxShop();
  if (!snapshot || !deviceId) return;

  await updateSandboxShop(() => approveSandboxStaffDevice(snapshot, deviceId));
  go("/settings/timekeeping?tab=devices");
}

function payrollError(error: unknown): PayrollFormActionState {
  return {
    status: "error",
    message: error instanceof Error ? error.message : "Could not update payroll.",
  };
}

export async function createSandboxPayrollPeriodAction(
  _previous: PayrollFormActionState,
  formData: FormData,
): Promise<PayrollFormActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return { status: "error", message: "The sample shop is still loading." };

  const parsed = payrollPeriodSchema.safeParse(parsePayrollPeriodFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  const result = createPayrollPeriodRecord(snapshot, parsed.data);
  if (!result.ok) return toFormActionState(result.error);
  await updateSandboxShop(() => result.snapshot);
  return { status: "success", message: "Payroll period created." };
}

export async function generateSandboxPayrollCutAction(
  _previous: PayrollFormActionState,
  formData: FormData,
): Promise<PayrollFormActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return { status: "error", message: "The sample shop is still loading." };

  const periodId = String(formData.get("periodId") ?? "");
  try {
    await updateSandboxShop((current) => generatePayrollCutRecord(current, periodId));
    return { status: "success", message: "Payroll cut generated." };
  } catch (error) {
    return payrollError(error);
  }
}

export async function updateSandboxPayrollPeriodStatusAction(
  _previous: PayrollFormActionState,
  formData: FormData,
): Promise<PayrollFormActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return { status: "error", message: "The sample shop is still loading." };

  const parsed = payrollPeriodStatusSchema.safeParse(parsePayrollPeriodStatusFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  try {
    await updateSandboxShop((current) =>
      updateSandboxPayrollPeriodStatus(current, parsed.data.periodId, parsed.data.status),
    );
    return { status: "success", message: "Payroll period updated." };
  } catch (error) {
    return payrollError(error);
  }
}

export async function saveSandboxCompensationProfileAction(
  _previous: PayrollFormActionState,
  formData: FormData,
): Promise<PayrollFormActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return { status: "error", message: "The sample shop is still loading." };

  const parsed = compensationProfileSchema.safeParse(parseCompensationProfileFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  try {
    await updateSandboxShop((current) => saveSandboxCompensationProfile(current, parsed.data));
    return { status: "success", message: "Compensation profile saved." };
  } catch (error) {
    return payrollError(error);
  }
}

export async function saveSandboxPayrollAdjustmentAction(
  _previous: PayrollFormActionState,
  formData: FormData,
): Promise<PayrollFormActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return { status: "error", message: "The sample shop is still loading." };

  const parsed = payrollAdjustmentSchema.safeParse(parsePayrollAdjustmentFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  try {
    await updateSandboxShop((current) => saveSandboxPayrollAdjustment(current, parsed.data));
    return { status: "success", message: "Payroll adjustment saved." };
  } catch (error) {
    return payrollError(error);
  }
}

export async function deleteSandboxPayrollAdjustmentAction(formData: FormData) {
  const snapshot = readSandboxShop();
  if (!snapshot) return;
  const adjustmentId = String(formData.get("adjustmentId") ?? "");
  const payrollPeriodId = String(formData.get("payrollPeriodId") ?? "");
  await updateSandboxShop((current) => deleteSandboxPayrollAdjustment(current, adjustmentId, payrollPeriodId));
}

export async function revokeSandboxStaffDeviceAction(formData: FormData) {
  const deviceId = String(formData.get("deviceId") ?? "");
  const snapshot = readSandboxShop();
  if (!snapshot || !deviceId) return;

  await updateSandboxShop(() => revokeSandboxStaffDevice(snapshot, deviceId));
  go("/settings/timekeeping?tab=devices");
}

export async function deleteSandboxStaffDeviceAction(formData: FormData) {
  const deviceId = String(formData.get("deviceId") ?? "");
  const snapshot = readSandboxShop();
  if (!snapshot || !deviceId) return;

  await updateSandboxShop(() => deleteSandboxStaffDevice(snapshot, deviceId));
  go("/settings/timekeeping?tab=devices");
}

export async function submitSandboxInventoryMovementAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return loadingError();

  const parsed = inventoryMovementSchema.safeParse(parseInventoryMovementFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  const result = applySandboxInventoryMovement(snapshot, {
    productId: parsed.data.productId,
    mode: parsed.data.movementMode,
    quantity: Number(parsed.data.quantity),
    notes: parsed.data.notes.trim() || null,
  });
  if (!result.ok) return { status: "error", message: result.message };

  await updateSandboxShop(() => result.snapshot);
  go("/inventory");
  return { status: "success" };
}

export async function updateSandboxInventoryStockSettingsAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return loadingError();

  const parsed = updateInventoryStockSettingsSchema.safeParse(parseUpdateInventoryStockSettingsFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  const result = updateSandboxInventorySettings(snapshot, {
    productId: parsed.data.productId,
    reorderLevel: parsed.data.reorderLevel ? Number(parsed.data.reorderLevel) : null,
    shelfLocation: parsed.data.shelfLocation.trim() || null,
  });
  if (!result.ok) return { status: "error", message: result.message };

  await updateSandboxShop(() => result.snapshot);
  go("/inventory");
  return { status: "success" };
}

export async function completeSandboxPosSaleAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return loadingError();

  const parsed = completePosSaleSchema.safeParse(parseCompletePosSaleFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  const result = completePosCartRecord(snapshot, {
    customerId: parsed.data.customerId,
    discount: Number(parsed.data.discount),
    paymentAmount: Number(parsed.data.paymentAmount),
    paymentMethod: parsed.data.paymentMethod,
    referenceNumber: parsed.data.referenceNumber,
    notes: parsed.data.notes,
    items: parsed.data.items,
  });
  if (!result.ok) return { status: "error", message: result.message };

  await updateSandboxShop(() => result.snapshot);
  go(`/invoices/${result.invoiceId}`);
  return { status: "success" };
}

export async function createSandboxInlineProductAction(
  _previous: InlineProductActionState,
  formData: FormData,
): Promise<InlineProductActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return { status: "error", message: "The sample shop is still loading." };

  const parsed = productFormSchema.safeParse(parseProductFormData(formData));
  if (!parsed.success) {
    const state = toFormActionState(parsed.error);
    return { status: "error", message: state.message, fieldErrors: state.fieldErrors };
  }

  const imageUrl = await readImageField(formData, "productImage");
  const result = saveProductRecord(snapshot, parsed.data, new Date(), imageUrl);
  await updateSandboxShop(() => result.snapshot);
  const product = result.product;

  return {
    status: "success",
    message: `${product.name} was added to the catalog.`,
    product: {
      id: product.id,
      label: product.name,
      sku: product.sku,
      barcode: product.barcode,
      productType: product.productType,
      unitLabel: product.unitLabel,
      unitPrice: product.sellingPrice,
      costPrice: product.costPrice,
      reorderLevel: product.reorderLevel,
      shelfLocation: product.shelfLocation,
      productImageUrl: product.productImageUrl,
    },
  };
}

export async function recordSandboxMechanicAttendanceAction(
  _previous: AttendanceEntryActionState,
  formData: FormData,
): Promise<AttendanceEntryActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return { status: "error", message: "The sample shop is still loading." };

  const logType = formData.get("logType");
  if (logType !== "time_in" && logType !== "time_out") {
    return { status: "error", message: "Choose time in or time out." };
  }

  const result = recordSandboxMechanicPunch(snapshot, logType);
  if (!result.ok) return { status: "error", message: result.message };

  await updateSandboxShop(() => result.snapshot);
  return {
    status: "success",
    message: logType === "time_in" ? "Time in recorded." : "Time out recorded.",
  };
}

export async function submitSandboxDtrAmendmentAction(
  _previous: TimekeepingActionState,
  formData: FormData,
): Promise<TimekeepingActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return { status: "error", message: "The sample shop is still loading." };

  const parsed = dtrAmendmentFormSchema.safeParse(parseDtrAmendmentFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  const result = submitSandboxDtrAmendment(snapshot, parsed.data);
  if (!result.ok) return { status: "error", message: result.message };

  await updateSandboxShop(() => result.snapshot);
  return { status: "success", message: "DTR amendment submitted for admin review." };
}

export async function reviewSandboxDtrAmendmentAction(
  _previous: TimekeepingActionState,
  formData: FormData,
): Promise<TimekeepingActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return { status: "error", message: "The sample shop is still loading." };

  const parsed = dtrAmendmentReviewSchema.safeParse(parseDtrAmendmentReviewFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  const result = reviewSandboxDtrAmendment(snapshot, parsed.data);
  if (!result.ok) return { status: "error", message: result.message };

  await updateSandboxShop(() => result.snapshot);
  return { status: "success", message: parsed.data.decision === "approved" ? "Amendment approved." : "Amendment rejected." };
}

function jobOrderError(error: unknown): FormActionState {
  return {
    status: "error",
    message: error instanceof Error ? error.message : "Could not update the job order.",
  };
}

export async function saveSandboxJobOrderDetailsAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return loadingError();

  const parsed = jobOrderDetailsSchema.safeParse(parseJobOrderDetailsFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  const result = saveJobOrderDetailsRecord(snapshot, parsed.data);
  if (!result.ok) return toFormActionState(result.error);
  await updateSandboxShop(() => result.snapshot);
  return { status: "success", message: "Job order details saved." };
}

export async function updateSandboxJobOrderStatusAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return loadingError();

  const parsed = jobOrderStatusTransitionSchema.safeParse(parseJobOrderStatusTransitionFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  try {
    await updateSandboxShop((current) =>
      updateJobOrderStatusRecord(current, parsed.data.jobOrderId, parsed.data.nextStatus),
    );
    return { status: "success", message: "Job order status updated." };
  } catch (error) {
    return jobOrderError(error);
  }
}

export async function assignSandboxMechanicAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return loadingError();

  const parsed = mechanicAssignmentSchema.safeParse(parseMechanicAssignmentFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  try {
    await updateSandboxShop((current) => assignMechanicRecord(current, parsed.data));
    return { status: "success", message: "Mechanic assigned." };
  } catch (error) {
    return jobOrderError(error);
  }
}

export async function addSandboxJobOrderItemAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return loadingError();

  const parsed = additionalJobOrderItemSchema.safeParse(parseAdditionalJobOrderItemFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  try {
    await updateSandboxShop((current) => addJobOrderItemRecord(current, parsed.data));
    return { status: "success", message: "Additional item added." };
  } catch (error) {
    return jobOrderError(error);
  }
}

export async function updateSandboxJobOrderItemAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return loadingError();

  const parsed = jobOrderItemEditSchema.safeParse(parseJobOrderItemEditFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  try {
    await updateSandboxShop((current) => updateJobOrderItemRecord(current, parsed.data));
    return { status: "success", message: "Job order item updated." };
  } catch (error) {
    return jobOrderError(error);
  }
}

export async function recordSandboxJobOrderPartUsageAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  return saveSandboxJobOrderPartMovement("use", formData);
}

export async function recordSandboxJobOrderPartReturnAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  return saveSandboxJobOrderPartMovement("return", formData);
}

async function saveSandboxJobOrderPartMovement(mode: "use" | "return", formData: FormData): Promise<FormActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return loadingError();

  const parsed = jobOrderPartUsageSchema.safeParse(parseJobOrderPartUsageFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  try {
    await updateSandboxShop((current) => recordJobOrderPartMovementRecord(current, mode, parsed.data));
    return { status: "success", message: mode === "use" ? "Part usage recorded." : "Part return recorded." };
  } catch (error) {
    return jobOrderError(error);
  }
}

export async function createSandboxInvoiceFromJobOrderAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return loadingError();

  const parsed = createInvoiceFromJobOrderSchema.safeParse(parseCreateInvoiceFromJobOrderFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  try {
    const result = createInvoiceFromJobOrderRecord(snapshot, parsed.data.jobOrderId);
    await updateSandboxShop(() => result.snapshot);
    go(`/invoices/${result.id}`);
    return { status: "success", message: "Invoice created." };
  } catch (error) {
    return jobOrderError(error);
  }
}

export async function releaseSandboxJobOrderVehicleAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return loadingError();

  const parsed = releaseJobOrderVehicleSchema.safeParse(parseReleaseJobOrderVehicleFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  try {
    await updateSandboxShop((current) => releaseJobOrderVehicleRecord(current, parsed.data.jobOrderId));
    go(`/job-orders/${parsed.data.jobOrderId}`);
    return { status: "success", message: "Vehicle released." };
  } catch (error) {
    return jobOrderError(error);
  }
}

export async function recordSandboxInvoicePaymentAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return loadingError();

  const parsed = recordInvoicePaymentSchema.safeParse(parseRecordInvoicePaymentFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  try {
    const result = recordPaymentRecord(snapshot, parsed.data);
    if (!result.ok) return toFormActionState(result.error);
    await updateSandboxShop(() => result.snapshot);
    go(`/invoices/${parsed.data.invoiceId}`);
    return { status: "success", message: "Payment recorded." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not record the payment.",
    };
  }
}

export async function cancelSandboxInvoiceAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return loadingError();

  const parsed = cancelInvoiceSchema.safeParse(parseCancelInvoiceFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  const result = cancelInvoiceRecord(snapshot, parsed.data);
  if (!result.ok) return { status: "error", message: result.message };

  await updateSandboxShop(() => result.snapshot);
  go(`/invoices/${parsed.data.invoiceId}`);
  return { status: "success", message: "Invoice cancelled." };
}

export async function removeSandboxMechanicAction(formData: FormData) {
  const jobOrderId = String(formData.get("jobOrderId") ?? "");
  const assignmentId = String(formData.get("assignmentId") ?? "");
  const snapshot = readSandboxShop();
  if (!snapshot) return;

  await updateSandboxShop((current) => removeMechanicRecord(current, jobOrderId, assignmentId));
}

export async function setSandboxJobOrderItemApprovalAction(formData: FormData) {
  const jobOrderId = String(formData.get("jobOrderId") ?? "");
  const jobOrderItemId = String(formData.get("jobOrderItemId") ?? "");
  const approvalStatus = String(formData.get("approvalStatus") ?? "");
  if (approvalStatus !== "pending" && approvalStatus !== "approved" && approvalStatus !== "rejected") return;

  const snapshot = readSandboxShop();
  if (!snapshot) return;

  await updateSandboxShop((current) =>
    setJobOrderItemApprovalRecord(current, jobOrderId, jobOrderItemId, approvalStatus),
  );
}

export async function setSandboxJobOrderChecklistAction(formData: FormData) {
  const snapshot = readSandboxShop();
  if (!snapshot) return;

  const parsed = jobOrderChecklistStateSchema.safeParse(parseJobOrderChecklistStateFormData(formData));
  if (!parsed.success) return;

  await updateSandboxShop((current) =>
    setJobOrderChecklistRecord(
      current,
      parsed.data.jobOrderId,
      parsed.data.jobOrderItemId,
      parsed.data.checklistCompleted === "true",
    ),
  );
}

export async function deleteSandboxJobOrderAction(formData: FormData) {
  const jobOrderId = String(formData.get("jobOrderId") ?? "");
  const snapshot = readSandboxShop();
  if (!snapshot) {
    go("/job-orders?error=The%20sample%20shop%20is%20still%20loading.");
    return;
  }

  const result = deleteJobOrderRecord(snapshot, jobOrderId);
  if (!result.ok) {
    go(`/job-orders?error=${encodeURIComponent(result.message)}`);
    return;
  }

  await updateSandboxShop(() => result.snapshot);
  go("/job-orders");
}

const VEHICLE_LOOKUPS_PATH = "/settings/vehicle-lookups";

export async function createSandboxVehicleMakeAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return loadingError();

  const parsed = vehicleMakeFormSchema.safeParse(parseVehicleMakeFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  const result = createVehicleMakeRecord(snapshot, parsed.data);
  if (!result.ok) return { status: "error", message: result.message };

  await updateSandboxShop(() => result.snapshot);
  go(VEHICLE_LOOKUPS_PATH);
  return { status: "success", message: "Vehicle make added." };
}

export async function createSandboxVehicleModelAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return loadingError();

  const parsed = vehicleModelFormSchema.safeParse(parseVehicleModelFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  const result = createVehicleModelRecord(snapshot, parsed.data);
  if (!result.ok) return { status: "error", message: result.message };

  await updateSandboxShop(() => result.snapshot);
  go(VEHICLE_LOOKUPS_PATH);
  return { status: "success", message: "Vehicle model added." };
}

export async function createSandboxVehicleLookupOptionAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const snapshot = readSandboxShop();
  if (!snapshot) return loadingError();

  const parsed = vehicleLookupOptionFormSchema.safeParse(parseVehicleLookupOptionFormData(formData));
  if (!parsed.success) return toFormActionState(parsed.error);

  const result = createVehicleLookupOptionRecord(snapshot, parsed.data);
  if (!result.ok) return { status: "error", message: result.message };

  await updateSandboxShop(() => result.snapshot);
  go(VEHICLE_LOOKUPS_PATH);
  return { status: "success", message: "Lookup option added." };
}

export async function updateSandboxVehicleMakeStatusAction(formData: FormData) {
  const snapshot = readSandboxShop();
  if (!snapshot) {
    go(`${VEHICLE_LOOKUPS_PATH}?error=The%20sample%20shop%20is%20still%20loading.`);
    return;
  }

  const makeId = String(formData.get("makeId") ?? "");
  const status = String(formData.get("status") ?? "") as VehicleStatus;
  const result = updateVehicleMakeStatusRecord(snapshot, makeId, status);
  if (!result.ok) {
    go(`${VEHICLE_LOOKUPS_PATH}?error=${encodeURIComponent(result.message)}`);
    return;
  }

  await updateSandboxShop(() => result.snapshot);
  go(VEHICLE_LOOKUPS_PATH);
}

export async function updateSandboxVehicleModelStatusAction(formData: FormData) {
  const snapshot = readSandboxShop();
  if (!snapshot) {
    go(`${VEHICLE_LOOKUPS_PATH}?error=The%20sample%20shop%20is%20still%20loading.`);
    return;
  }

  const modelId = String(formData.get("modelId") ?? "");
  const status = String(formData.get("status") ?? "") as VehicleStatus;
  const result = updateVehicleModelStatusRecord(snapshot, modelId, status);
  if (!result.ok) {
    go(`${VEHICLE_LOOKUPS_PATH}?error=${encodeURIComponent(result.message)}`);
    return;
  }

  await updateSandboxShop(() => result.snapshot);
  go(VEHICLE_LOOKUPS_PATH);
}

export async function updateSandboxVehicleLookupOptionStatusAction(formData: FormData) {
  const snapshot = readSandboxShop();
  if (!snapshot) {
    go(`${VEHICLE_LOOKUPS_PATH}?error=The%20sample%20shop%20is%20still%20loading.`);
    return;
  }

  const optionId = String(formData.get("optionId") ?? "");
  const status = String(formData.get("status") ?? "") as VehicleStatus;
  const result = updateVehicleLookupOptionStatusRecord(snapshot, optionId, status);
  if (!result.ok) {
    go(`${VEHICLE_LOOKUPS_PATH}?error=${encodeURIComponent(result.message)}`);
    return;
  }

  await updateSandboxShop(() => result.snapshot);
  go(VEHICLE_LOOKUPS_PATH);
}

export async function deleteSandboxVehicleMakeAction(formData: FormData) {
  const snapshot = readSandboxShop();
  if (!snapshot) {
    go(`${VEHICLE_LOOKUPS_PATH}?error=The%20sample%20shop%20is%20still%20loading.`);
    return;
  }

  const makeId = String(formData.get("makeId") ?? "");
  const result = deleteVehicleMakeRecord(snapshot, makeId);
  if (!result.ok) {
    go(`${VEHICLE_LOOKUPS_PATH}?error=${encodeURIComponent(result.message)}`);
    return;
  }

  await updateSandboxShop(() => result.snapshot);
  go(VEHICLE_LOOKUPS_PATH);
}

export async function deleteSandboxVehicleModelAction(formData: FormData) {
  const snapshot = readSandboxShop();
  if (!snapshot) {
    go(`${VEHICLE_LOOKUPS_PATH}?error=The%20sample%20shop%20is%20still%20loading.`);
    return;
  }

  const modelId = String(formData.get("modelId") ?? "");
  const result = deleteVehicleModelRecord(snapshot, modelId);
  if (!result.ok) {
    go(`${VEHICLE_LOOKUPS_PATH}?error=${encodeURIComponent(result.message)}`);
    return;
  }

  await updateSandboxShop(() => result.snapshot);
  go(VEHICLE_LOOKUPS_PATH);
}

async function readImageField(formData: FormData, key: string) {
  const value = formData.get(key);
  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(value);
  });
}
