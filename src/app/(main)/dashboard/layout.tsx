import { getRestaurantProfile } from '@/actions/restaurantActions';
import { DashboardProvider } from './DashboardProvider';
import DashboardSidebar from './DashboardSidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getRestaurantProfile();

  return (
    <DashboardProvider profile={profile.data ?? null}>
      <DashboardSidebar restaurant={profile.data ?? null}>{children}</DashboardSidebar>
    </DashboardProvider>
  );
}
