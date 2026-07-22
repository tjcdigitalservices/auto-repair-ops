/**
 * Bootstrap a platform admin (and optional legacy shop owner) for an Auth user.
 *
 * Usage:
 *   npx tsx scripts/bootstrap-platform-admin.ts you@example.com
 *   npx tsx scripts/bootstrap-platform-admin.ts you@example.com --also-staff
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    const key = line.slice(0, i).trim();
    const value = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const email = process.argv[2]?.trim().toLowerCase();
const alsoStaff = process.argv.includes("--also-staff");

if (!email) {
  console.error("Usage: npx tsx scripts/bootstrap-platform-admin.ts you@example.com [--also-staff]");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findUserIdByEmail(targetEmail: string) {
  let page = 1;
  const perPage = 200;

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const match = data.users.find((user) => user.email?.toLowerCase() === targetEmail);
    if (match) return match.id;

    if (data.users.length < perPage) break;
    page += 1;
  }

  return null;
}

async function main() {
  const userId = await findUserIdByEmail(email);
  if (!userId) {
    console.error(`No Auth user found for ${email}. Create the user in Supabase Auth first.`);
    process.exit(1);
  }

  console.log(`Found Auth user: ${userId}`);

  const { error: platformError } = await admin.from("platform_admins").upsert({
    user_id: userId,
    role: "platform_owner",
    display_name: "Platform Owner",
  });

  if (platformError) {
    console.error("Failed to upsert platform_admins:", platformError.message);
    process.exit(1);
  }

  console.log("Linked as platform_owner in platform_admins.");

  if (alsoStaff) {
    const { data: tenant, error: tenantError } = await admin
      .from("tenants")
      .select("id")
      .eq("slug", "legacy")
      .maybeSingle();

    if (tenantError || !tenant) {
      console.error("Could not find legacy tenant:", tenantError?.message ?? "missing");
      process.exit(1);
    }

    const { data: branch, error: branchError } = await admin
      .from("branches")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("is_main", true)
      .maybeSingle();

    if (branchError || !branch) {
      console.error("Could not find legacy main branch:", branchError?.message ?? "missing");
      process.exit(1);
    }

    const { data: existingStaff } = await admin
      .from("staff")
      .select("id")
      .eq("linked_user_id", userId)
      .maybeSingle();

    if (existingStaff) {
      const { error: updateError } = await admin
        .from("staff")
        .update({
          tenant_id: tenant.id,
          branch_id: branch.id,
          role: "owner",
          status: "active",
        })
        .eq("id", existingStaff.id);

      if (updateError) {
        console.error("Failed to update staff:", updateError.message);
        process.exit(1);
      }
      console.log("Updated existing staff row as active owner on legacy.");
    } else {
      const { error: insertError } = await admin.from("staff").insert({
        tenant_id: tenant.id,
        branch_id: branch.id,
        linked_user_id: userId,
        first_name: "Owner",
        last_name: "Account",
        role: "owner",
        status: "active",
      });

      if (insertError) {
        console.error("Failed to insert staff:", insertError.message);
        process.exit(1);
      }
      console.log("Created staff owner on legacy tenant.");
    }
  }

  console.log("\nDone. Sign out if needed, then sign in again at http://localhost:3000/login");
  console.log("Expected redirect: /platform");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
