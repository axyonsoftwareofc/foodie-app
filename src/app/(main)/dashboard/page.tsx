// app/dashboard/page.tsx — DASHBOARD PREMIUM (Server Component)
import { getOrderStats } from '@/actions/orders';
import { DashboardHome } from './DashboardHome';

export default async function DashboardPage() {
  // Busca os stats no servidor — os dados já chegam no primeiro paint,
  // sem o waterfall client-side (render → useEffect → fetch).
  const { data: stats } = await getOrderStats();

  return <DashboardHome stats={stats ?? null} />;
}
