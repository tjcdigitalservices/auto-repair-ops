import "server-only";

import {
  buildMechanicPortalUsername,
  buildMechanicTemporaryPassword,
  isMechanicPortalUsername,
  MECHANIC_PORTAL_EMAIL_DOMAIN,
  normalizeMechanicPortalUsernameInput,
} from "@/features/staff/mechanic-login";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type MechanicPortalLoginCredentials = {
  userId: string;
  username: string;
  temporaryPassword: string;
};

export async function listMechanicPortalUsernames() {
  const admin = getSupabaseAdminClient();
  const takenUsernames = new Set<string>();
  let page = 1;
  const perPage = 200;
  const domainSuffix = `@${MECHANIC_PORTAL_EMAIL_DOMAIN}`;

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw new Error(error.message);
    }

    for (const user of data.users) {
      const email = user.email?.trim().toLowerCase();

      if (email?.endsWith(domainSuffix)) {
        takenUsernames.add(email);
      }
    }

    if (data.users.length < perPage) {
      break;
    }

    page += 1;
  }

  return takenUsernames;
}

export async function provisionMechanicPortalLogin(params: {
  firstName: string;
  lastName: string;
}): Promise<MechanicPortalLoginCredentials> {
  const admin = getSupabaseAdminClient();
  const takenUsernames = await listMechanicPortalUsernames();
  const username = buildMechanicPortalUsername({
    firstName: params.firstName,
    lastName: params.lastName,
    takenUsernames,
  });
  const temporaryPassword = buildMechanicTemporaryPassword(params.lastName);

  const { data, error } = await admin.auth.admin.createUser({
    email: username,
    password: temporaryPassword,
    email_confirm: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  const userId = data.user?.id;

  if (!userId) {
    throw new Error("Portal login could not be created.");
  }

  return {
    userId,
    username,
    temporaryPassword,
  };
}

export async function deleteMechanicPortalLogin(userId: string) {
  const admin = getSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function findAuthUserIdByEmail(email: string) {
  const admin = getSupabaseAdminClient();
  const normalizedEmail = email.trim().toLowerCase();
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

export async function linkExistingMechanicPortalLogin(params: {
  portalUsername: string;
  staffId: string;
}) {
  const username = normalizeMechanicPortalUsernameInput(params.portalUsername);

  if (!username) {
    throw new Error("Enter a portal username to link.");
  }

  if (!isMechanicPortalUsername(username)) {
    throw new Error(`Portal usernames must use @${MECHANIC_PORTAL_EMAIL_DOMAIN}.`);
  }

  const userId = await findAuthUserIdByEmail(username);

  if (!userId) {
    throw new Error("No portal account was found for that username.");
  }

  const admin = getSupabaseAdminClient();
  const { data: existingStaff, error: existingStaffError } = await admin
    .from("staff")
    .select("id, first_name, last_name")
    .eq("linked_user_id", userId)
    .maybeSingle();

  if (existingStaffError) {
    throw new Error(existingStaffError.message);
  }

  if (existingStaff && existingStaff.id !== params.staffId) {
    throw new Error("That portal account is already linked to another staff record.");
  }

  return {
    userId,
    username,
  };
}

export async function getPortalUsernameForLinkedUser(userId: string | null) {
  if (!userId) {
    return null;
  }

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);

  if (error) {
    throw new Error(error.message);
  }

  return data.user.email ?? null;
}
