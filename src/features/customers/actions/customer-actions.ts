"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { applyBranchFilter, getBranchScopedServerClient } from "@/lib/branches";
import { toFormActionState } from "@/lib/forms";
import {
  customerFormSchema,
  deriveCustomerDisplayName,
  parseCustomerFormData,
} from "@/features/customers/schemas/customer-form-schema";
import {
  deleteCustomerPortalLogin,
  provisionCustomerPortalLogin,
} from "@/features/customers/services/customer-portal-login";
import {
  INITIAL_CUSTOMER_ACTION_STATE,
  type CustomerActionState,
} from "@/features/customers/types";

export async function createCustomerAction(
  _prevState: CustomerActionState = INITIAL_CUSTOMER_ACTION_STATE,
  formData: FormData,
): Promise<CustomerActionState> {
  return saveCustomer(formData);
}

export async function updateCustomerAction(
  _prevState: CustomerActionState = INITIAL_CUSTOMER_ACTION_STATE,
  formData: FormData,
): Promise<CustomerActionState> {
  return saveCustomer(formData);
}

export async function provisionCustomerPortalLoginAction(
  _prevState: CustomerActionState = INITIAL_CUSTOMER_ACTION_STATE,
  formData: FormData,
): Promise<CustomerActionState> {
  const customerId = readFormDataString(formData, "customerId");

  if (!customerId) {
    return { status: "error", message: "Customer id is required." };
  }

  const { branchScope, supabase } = await getBranchScopedServerClient("customers:write");
  const { data: customer, error } = await applyBranchFilter(
    supabase
      .from("customers")
      .select(
        "id, display_name, first_name, last_name, company_name, email, linked_user_id, status",
      ),
    branchScope.selectedBranchId,
  )
    .eq("id", customerId)
    .maybeSingle();

  if (error) {
    return { status: "error", message: error.message };
  }

  if (!customer) {
    return { status: "error", message: "Customer record not found." };
  }

  if (customer.linked_user_id) {
    return { status: "error", message: "This customer already has an app login." };
  }

  if (!customer.email?.trim()) {
    return {
      status: "error",
      message: "Add an email on the customer record before creating an app login.",
    };
  }

  if (customer.status !== "active") {
    return {
      status: "error",
      message: "Only active customers can receive an app login.",
    };
  }

  let createdLogin: Awaited<ReturnType<typeof provisionCustomerPortalLogin>> | null = null;

  try {
    createdLogin = await provisionCustomerPortalLogin({
      email: customer.email,
      lastName: customer.last_name,
      companyName: customer.company_name,
      displayName: customer.display_name,
    });

    const { error: linkError } = await applyBranchFilter(
      supabase.from("customers").update({ linked_user_id: createdLogin.userId }),
      branchScope.selectedBranchId,
    ).eq("id", customerId);

    if (linkError) {
      throw new Error(linkError.message);
    }
  } catch (provisionError) {
    if (createdLogin?.userId) {
      try {
        await deleteCustomerPortalLogin(createdLogin.userId);
      } catch {
        // Best-effort cleanup only.
      }
    }

    return {
      status: "error",
      message:
        provisionError instanceof Error
          ? provisionError.message
          : "Customer app login could not be created.",
    };
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);

  return {
    status: "success",
    message: "Customer app login created.",
    portalLogin: {
      customerId,
      customerName: customer.display_name,
      email: createdLogin.email,
      temporaryPassword: createdLogin.temporaryPassword,
    },
  };
}

export async function deleteCustomerAction(formData: FormData) {
  const customerId = readFormDataString(formData, "customerId");

  if (!customerId) {
    redirect("/customers?error=Invalid customer request.");
  }

  const { branchScope, supabase } = await getBranchScopedServerClient("customers:write");
  const { data: customer, error: customerError } = await applyBranchFilter(
    supabase.from("customers").select("id, display_name, branch_id"),
    branchScope.selectedBranchId,
  )
    .eq("id", customerId)
    .maybeSingle();

  if (customerError) {
    redirect(`/customers?error=${encodeURIComponent(customerError.message)}`);
  }

  if (!customer) {
    redirect("/customers?error=Customer record not found.");
  }

  const { error } = await applyBranchFilter(
    supabase.from("customers").delete(),
    branchScope.selectedBranchId,
  ).eq("id", customerId);

  if (error) {
    redirect(`/customers?error=${encodeURIComponent(toCustomerDeleteErrorMessage(error.message))}`);
  }

  revalidatePath("/customers");
  revalidatePath("/vehicles");
  redirect("/customers");
}

async function saveCustomer(formData: FormData): Promise<CustomerActionState> {
  const parsed = customerFormSchema.safeParse(parseCustomerFormData(formData));

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const values = parsed.data;
  const { branchScope, supabase } = await getBranchScopedServerClient("customers:write");
  const branchId = values.customerId
    ? await getExistingCustomerBranchId(supabase, branchScope.selectedBranchId, values.customerId)
    : branchScope.writeBranchId;
  const payload = {
    branch_id: branchId,
    customer_type: values.customerType,
    display_name: deriveCustomerDisplayName(values),
    first_name: values.firstName || null,
    last_name: values.lastName || null,
    company_name: values.companyName || null,
    contact_number: values.contactNumber || null,
    email: values.email || null,
    address: values.address || null,
    notes: values.notes || null,
    status: values.status,
  };

  const isCreate = !values.customerId;
  const shouldCreatePortalLogin = isCreate && values.createPortalLogin;

  const operation = values.customerId
    ? applyBranchFilter(
        supabase.from("customers").update(payload),
        branchScope.selectedBranchId,
      )
        .eq("id", values.customerId)
        .select("id, display_name")
        .single()
    : supabase.from("customers").insert(payload).select("id, display_name").single();

  const { data, error } = await operation;

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  if (!data?.id) {
    return {
      status: "error",
      message: "Customer record could not be saved.",
    };
  }

  if (shouldCreatePortalLogin) {
    let createdLogin: Awaited<ReturnType<typeof provisionCustomerPortalLogin>> | null = null;

    try {
      createdLogin = await provisionCustomerPortalLogin({
        email: values.email,
        lastName: values.lastName,
        companyName: values.companyName,
        displayName: data.display_name,
      });

      const { error: linkError } = await applyBranchFilter(
        supabase.from("customers").update({ linked_user_id: createdLogin.userId }),
        branchScope.selectedBranchId,
      ).eq("id", data.id);

      if (linkError) {
        throw new Error(linkError.message);
      }
    } catch (provisionError) {
      if (createdLogin?.userId) {
        try {
          await deleteCustomerPortalLogin(createdLogin.userId);
        } catch {
          // Best-effort cleanup only.
        }
      }

      await applyBranchFilter(
        supabase.from("customers").delete(),
        branchScope.selectedBranchId,
      ).eq("id", data.id);

      return {
        status: "error",
        message:
          provisionError instanceof Error
            ? provisionError.message
            : "Customer app login could not be created. The customer record was rolled back.",
      };
    }

    revalidatePath("/customers");
    revalidatePath(`/customers/${data.id}`);
    revalidatePath("/vehicles");

    return {
      status: "success",
      message: "Customer created with app login.",
      portalLogin: {
        customerId: data.id,
        customerName: data.display_name,
        email: createdLogin.email,
        temporaryPassword: createdLogin.temporaryPassword,
      },
    };
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${data.id}`);
  revalidatePath("/vehicles");

  redirect(values.customerId ? `/customers/${values.customerId}` : `/customers/${data.id}`);
}

function readFormDataString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function toCustomerDeleteErrorMessage(message: string) {
  if (
    message.includes("violates foreign key constraint") ||
    message.includes("update or delete on table")
  ) {
    return "This customer cannot be deleted because it is already linked to vehicles or operational records.";
  }

  return message;
}

async function getExistingCustomerBranchId(
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"],
  selectedBranchId: string | null,
  customerId: string,
) {
  const { data, error } = await applyBranchFilter(
    supabase.from("customers").select("branch_id"),
    selectedBranchId,
  )
    .eq("id", customerId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.branch_id) {
    throw new Error("Customer record does not exist.");
  }

  return data.branch_id;
}
