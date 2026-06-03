// src/app/dashboard/cozinha/page.tsx
import { getOrdersForRestaurant } from '@/actions/orders';
import CozinhaClient from './cozinha-client';

export default async function CozinhaPage() {
  let initialOrders: import('@/hooks/useKitchenOrders').Order[] | undefined;

  try {
    const result = await getOrdersForRestaurant({
      filters: {},
    });
    initialOrders = result.data;
  } catch {
    initialOrders = undefined;
  }

  return <CozinhaClient initialOrders={initialOrders} />;
}
