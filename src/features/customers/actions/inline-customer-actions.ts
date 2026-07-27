"use server";

import { revalidatePath } from "next/cache";

import { mapCustomerRowToOption } from "@/features/customers/mappers";
import {
  INITIAL_INLINE_CUSTOMER_CREATE_ACTION_STATE,
  type InlineCustomerCreateActionState,
} from "@/features/customers/inline-customer-action-state";
import {
  inlineCustomerCreateSchema,
  parseInlineCustomerCreateFormData,
} from "@/features/customers/schemas/inline-customer-create-schema";
import { getBranchScopedServerClient } from "@/lib/branches";
import { toFormActionState } from "@/lib/forms";

export async function quickCreateCustomerAction(
  _prevState: InlineCustomerCreateActionState = INITIAL_INLINE_CUSTOMER_CREATE_ACTION_STATE,
  formData: FormData,
): Promise<InlineCustomerCreateActionState> {
  const parsed = inlineCustomerCreateSchema.safeParse(parseInlineCustomerCreateFormData(formData));

  if (!parsed.success) {
    return {
      ...toFormActionState(parsed.error),
      status: "error",
    };
  }

  const values = parsed.data;
  const { branchScope, supabase } = await getBranchScopedServerClient("customers:write");
  const displayName = `${values.firstName} ${values.lastName}`.trim();

  const { data, error } = await supabase
    .from("customers")
    .insert({
      branch_id: branchScope.writeBranchId,
      customer_type: "individual",
      display_name: displayName,
      first_name: values.firstName,
      last_name: values.lastName,
      company_name: null,
      contact_number: values.contactNumber,
      email: values.email || null,
      address: values.address || null,
      notes: values.notes || null,
      status: "active",
    })
    .select("id, display_name")
    .single();

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/customers");
  revalidatePath("/vehicles");
  revalidatePath("/vehicles/new");
  revalidatePath("/quotations");
  revalidatePath("/quotations/new");

  return {
    status: "success",
    message: `${data.display_name} is ready to use.`,
    data: mapCustomerRowToOption(data),
  };
}
