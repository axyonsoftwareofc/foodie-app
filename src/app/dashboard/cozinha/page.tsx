// src/app/dashboard/cozinha/page.tsx
import { getOrdersForRestaurant } from '@/actions/orders';
import CozinhaClient from './cozinha-client';

export default async function CozinhaPage() {
  let initialOrders: import('@/hooks/useKitchenOrders').Order[] | undefined;
  let fetchError: string | undefined;

  try {
    const result = await getOrdersForRestaurant({
      filters: {},
    });
    initialOrders = result.data;
    if (result.error) fetchError = result.error;
  } catch {
    fetchError = 'Falha ao carregar pedidos da cozinha';
    initialOrders = undefined;
  }

  return <CozinhaClient initialOrders={initialOrders} initialError={fetchError} />;
}
