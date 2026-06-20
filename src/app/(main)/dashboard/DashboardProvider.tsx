'use client';

import { createContext, useContext } from 'react';
import type { RestaurantProfile } from '@/types/restaurant-management.types';

const DashboardContext = createContext<{
  profile: RestaurantProfile | null;
}>({ profile: null });

export function useDashboard() {
  return useContext(DashboardContext);
}

export function DashboardProvider({
  profile,
  children,
}: {
  profile: RestaurantProfile | null;
  children: React.ReactNode;
}) {
  return <DashboardContext.Provider value={{ profile }}>{children}</DashboardContext.Provider>;
}
