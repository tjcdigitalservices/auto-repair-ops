"use server";

import { revalidatePath } from "next/cache";

import { quickCreateCustomerAction as createInlineCustomerAction } from "@/features/customers/actions/inline-customer-actions";
import {
  INITIAL_INLINE_CUSTOMER_CREATE_ACTION_STATE,
  type InlineCustomerCreateActionState as QuotationQuickCustomerActionState,
} from "@/features/customers/inline-customer-action-state";
import type { CustomerOption } from "@/features/customers/types";
import { getBranchScopedServerClient } from "@/lib/branches";
import { toFormActionState } from "@/lib/forms";
import {
  vehicleFormSchema,
} from "@/features/vehicles/schemas/vehicle-form-schema";
import type { VehicleFormValues } from "@/features/vehicles/types";
import type { QuotationVehicleOption } from "@/features/quotations/types";

type QuotationCreateFlowActionState<TData> = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  data?: TData;
};

export type { QuotationQuickCustomerActionState };
export type QuotationQuickVehicleActionState = QuotationCreateFlowActionState<QuotationVehicleOption>;

const INITIAL_QUOTATION_CREATE_FLOW_ACTION_STATE = {
  status: "idle",
} as const satisfies QuotationCreateFlowActionState<never>;

export async function quickCreateCustomerForQuotationAction(
  prevState: QuotationQuickCustomerActionState = INITIAL_INLINE_CUSTOMER_CREATE_ACTION_STATE,
  formData: FormData,
): Promise<QuotationQuickCustomerActionState> {
  return createInlineCustomerAction(prevState, formData);
}

export async function quickCreateVehicleForQuotationAction(
  _prevState: QuotationQuickVehicleActionState = INITIAL_QUOTATION_CREATE_FLOW_ACTION_STATE,
  formData: FormData,
): Promise<QuotationQuickVehicleActionState> {
  const parsed = vehicleFormSchema.safeParse(parseQuickVehicleFormData(formData));

  if (!parsed.success) {
    return {
      ...toFormActionState(parsed.error),
      status: "error",
    };
  }

  const values = parsed.data;
  const { branchScope, supabase } = await getBranchScopedServerClient("vehicles:write");
  const normalizedPlateNumber = normalizeNullableUpper(values.plateNumber);
  const normalizedVin = normalizeNullableUpper(values.vin);

  const [plateConflict, vinConflict] = await Promise.all([
    normalizedPlateNumber
      ? supabase
          .from("vehicles")
          .select("id")
          .eq("branch_id", branchScope.writeBranchId)
          .eq("plate_number", normalizedPlateNumber)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    normalizedVin
      ? supabase
          .from("vehicles")
          .select("id")
          .eq("branch_id", branchScope.writeBranchId)
          .eq("vin", normalizedVin)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (plateConflict.error) {
    return {
      status: "error",
      message: plateConflict.error.message,
    };
  }

  if (vinConflict.error) {
    return {
      status: "error",
      message: vinConflict.error.message,
    };
  }

  if (plateConflict.data) {
    return {
      status: "error",
      message: "A vehicle with this plate number already exists.",
      fieldErrors: {
        plateNumber: ["A vehicle with this plate number already exists."],
      },
    };
  }

  if (vinConflict.data) {
    return {
      status: "error",
      message: "A vehicle with this VIN already exists.",
      fieldErrors: {
        vin: ["A vehicle with this VIN already exists."],
      },
    };
  }

  const payload = {
    branch_id: branchScope.writeBranchId,
    customer_id: values.customerId,
    make: values.make,
    model: values.model,
    year: values.year ? Number(values.year) : null,
    transmission: normalizeNullable(values.transmission),
    mileage: values.mileage ? Number(values.mileage) : null,
    plate_number: normalizedPlateNumber,
    vin: normalizedVin,
    engine: normalizeNullable(values.engineSize),
    variant: normalizeNullable(values.variant),
    fuel_type: normalizeNullable(values.fuelType),
    color: normalizeNullable(values.color),
    status: values.status,
  };

  const { data, error } = await supabase
    .from("vehicles")
    .insert(payload)
    .select("id, customer_id, make, model, year, plate_number")
    .single();

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/vehicles");
  revalidatePath(`/customers/${data.customer_id}`);
  revalidatePath("/quotations");
  revalidatePath("/quotations/new");

  return {
    status: "success",
    message: `${data.make} ${data.model} is ready for quotation intake.`,
    data: mapVehicleRowToQuotationOption(data),
  };
}

function parseQuickVehicleFormData(formData: FormData): VehicleFormValues {
  return {
    customerId: readString(formData, "customerId"),
    make: readString(formData, "make"),
    model: readString(formData, "model"),
    year: readString(formData, "year"),
    transmission: readString(formData, "transmission"),
    mileage: readString(formData, "mileage"),
    plateNumber: readString(formData, "plateNumber"),
    vin: readString(formData, "vin"),
    engineSize: readString(formData, "engineSize"),
    variant: readString(formData, "variant"),
    fuelType: readString(formData, "fuelType"),
    color: readString(formData, "color"),
    status: "active",
  };
}

function mapVehicleRowToQuotationOption(row: {
  id: string;
  customer_id: string;
  make: string;
  model: string;
  year: number | null;
  plate_number: string | null;
}): QuotationVehicleOption {
  const platePart = row.plate_number ? ` · ${row.plate_number}` : "";
  const yearPart = row.year ? ` (${row.year})` : "";

  return {
    id: row.id,
    customerId: row.customer_id,
    label: `${row.make} ${row.model}${yearPart}${platePart}`,
  };
}

function normalizeNullable(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeNullableUpper(value: string) {
  const trimmed = value.trim().toUpperCase();
  return trimmed ? trimmed : null;
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
