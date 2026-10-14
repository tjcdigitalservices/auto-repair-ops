import {
  attendanceEntrySchema,
  parseAttendanceEntryFormData,
} from "@/features/attendance/schemas/attendance-form-schema";
import {
  parseStaffScheduleFormData,
  staffScheduleSchema,
} from "@/features/attendance/schemas/staff-schedule-schema";
import type { AttendanceEntryActionState } from "@/features/attendance/types";
import {
  customerFormSchema,
  parseCustomerFormData,
} from "@/features/customers/schemas/customer-form-schema";
import type { FormActionState } from "@/lib/forms";
import { toFormActionState } from "@/lib/forms";
import { productFormSchema, parseProductFormData } from "@/features/products/schemas/product-form-schema";
import { serviceFormSchema, parseServiceFormData } from "@/features/services/schemas/service-form-schema";
import { staffFormSchema, parseStaffFormData } from "@/features/staff/schemas/staff-form-schema";
import type { StaffActionState } from "@/features/staff/types";
import { supplierFormSchema, parseSupplierFormData } from "@/features/suppliers/schemas/supplier-form-schema";
import { vehicleFormSchema, parseVehicleFormData } from "@/features/vehicles/schemas/vehicle-form-schema";
import {
  businessProfileSettingsSchema,
  parseBusinessProfileSettingsFormData,
} from "@/features/settings/schemas/settings-forms";
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
import {
  approveQuotationRecord,
  deleteCustomerRecord,
  deleteQuotationRecord,
  rejectQuotationRecord,
  reviseQuotationRecord,
  saveBusinessProfile,
  saveCustomerRecord,
  saveProductRecord,
  saveQuotationFromForm,
  saveServiceRecord,
  saveStaffRecord,
  saveStaffScheduleRecord,
  saveSupplierRecord,
  saveVehicleRecord,
  upsertAttendanceRecord,
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
