import "server-only";

import {
  buildCustomerTemporaryPassword,
  normalizeCustomerPortalEmail,
} from "@/features/customers/customer-login";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type CustomerPortalLoginCredentials = {
  userId: string;
  email: string;
  temporaryPassword: string;
};

export async function provisionCustomerPortalLogin(params: {
  email: string;
  lastName?: string | null;
  companyName?: string | null;
  displayName?: string | null;
}): Promise<CustomerPortalLoginCredentials> {
  const email = normalizeCustomerPortalEmail(params.email);

  if (!email) {
    throw new Error("Email is required to create a customer app login.");
  }

  const temporaryPassword = buildCustomerTemporaryPassword({
    lastName: params.lastName,
    companyName: params.companyName,
    displayName: params.displayName,
  });

  const admin = getSupabaseAdminClient();

  const { data: existingCustomer, error: existingCustomerError } = await admin
    .from("customers")
    .select("id, display_name")
    .eq("email", email)
    .not("linked_user_id", "is", null)
    .maybeSingle();

  if (existingCustomerError) {
    throw new Error(existingCustomerError.message);
  }

  if (existingCustomer) {
    throw new Error(
      `A customer app login already exists for this email (${existingCustomer.display_name}).`,
    );
  }

  const existingUserId = await findAuthUserIdByEmail(email);

  if (existingUserId) {
    throw new Error(
      "An auth account already exists for this email. Link it manually or use a different email.",
    );
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  const userId = data.user?.id;

  if (!userId) {
    throw new Error("Customer app login could not be created.");
  }

  return {
    userId,
    email,
    temporaryPassword,
  };
}

export async function deleteCustomerPortalLogin(userId: string) {
  const admin = getSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function findAuthUserIdByEmail(email: string) {
  const admin = getSupabaseAdminClient();
  const normalizedEmail = normalizeCustomerPortalEmail(email);
  let page = 1;
  const perPage = 200;

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw new Error(error.message);
    }

    const match = data.users.find((user) => user.email?.trim().toLowerCase() === normalizedEmail);

    if (match?.id) {
      return match.id;
    }

    if (data.users.length < perPage) {
      break;
    }

    page += 1;
  }

  return null;
}

export async function getPortalEmailForLinkedUser(linkedUserId: string) {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(linkedUserId);

  if (error) {
    throw new Error(error.message);
  }

  return data.user?.email?.trim().toLowerCase() ?? null;
}
