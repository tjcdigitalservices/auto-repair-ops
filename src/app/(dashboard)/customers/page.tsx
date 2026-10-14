import { CustomersPageView } from "@/features/customers/components/customers-page-view";
import { listCustomers } from "@/features/customers/queries/customer-queries";
import { requireAuthenticatedStaff } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type CustomersPageProps = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    error?: string;
  }>;
};

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const { search = "", page, error } = await searchParams;
  const [customers, session] = await Promise.all([listCustomers(search), requireAuthenticatedStaff()]);

  return (
    <CustomersPageView
      customers={customers}
      search={search}
      page={page}
      error={error}
      canManageCustomers={session.capabilities.includes("customers:write")}
    />
  );
}
