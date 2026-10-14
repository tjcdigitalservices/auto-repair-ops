import { DashboardHome } from '@/features/dashboard/components/dashboard-home';
import { getDashboardData } from '@/features/dashboard/queries/dashboard-queries';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const dashboard = await getDashboardData();
  return <DashboardHome dashboard={dashboard} />;
}
