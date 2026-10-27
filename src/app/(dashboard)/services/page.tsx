import { ServicesPageView } from "@/features/services/components/services-page-view";
import { listServices } from "@/features/services/queries/service-queries";

export const dynamic = "force-dynamic";

type ServicesPageProps = {
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
};

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const { search = "", page } = await searchParams;
  const services = await listServices(search);

  return <ServicesPageView services={services} search={search} page={page} />;
}
