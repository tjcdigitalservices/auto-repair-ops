import { redirect } from "next/navigation";

import { requireAuthenticatedStaff } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function DocumentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: staff } = await supabase
    .from("staff")
    .select("id, status")
    .eq("linked_user_id", user.id)
    .maybeSingle();

  if (staff?.status === "active") {
    await requireAuthenticatedStaff();
    return children;
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("linked_user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (customer?.id) {
    // Linked customers may open their own quotation print pages from the mobile app WebView.
    return children;
  }

  redirect("/login?reason=inactive");
}
