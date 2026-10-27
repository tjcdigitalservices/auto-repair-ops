import { SuppliersPageView } from "@/features/suppliers/components/suppliers-page-view";
import { listSuppliers } from "@/features/suppliers/queries/supplier-queries";

export const dynamic = "force-dynamic";

type SuppliersPageProps = {
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
};

export default async function SuppliersPage({ searchParams }: SuppliersPageProps) {
  const { search = "", page } = await searchParams;
  const suppliers = await listSuppliers(search);

  return <SuppliersPageView suppliers={suppliers} search={search} page={page} />;
}
