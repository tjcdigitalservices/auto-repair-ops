import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import type { TableRow } from "@/types/database";

type SupplierRow = TableRow<"suppliers">;

export async function listSupplierSpreadsheetRows() {
  const { supabase } = await getAuthorizedSupabaseServerClient("suppliers:read");
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .order("supplier_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as SupplierRow[]).map((row) => ({
    "Supplier Name": row.supplier_name,
    "Contact Person": row.contact_person ?? "",
    "Contact Number": row.contact_number ?? "",
    Email: row.email ?? "",
    Address: row.address ?? "",
    "Payment Terms": row.payment_terms ?? "",
    Notes: row.notes ?? "",
    Status: row.status,
  }));
}
