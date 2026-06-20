// src/app/super-admin/restaurants/page.tsx
import { getAllRestaurants } from '@/actions/super-admin-actions';
import RestaurantsClient from './restaurants-client';

export default async function RestaurantsPage() {
  const result = await getAllRestaurants(1, '');
  const data = result.data;

  return (
    <div
      className="p-4 max-w-5xl mx-auto"
      style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}
    >
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
        Restaurantes
      </h1>
      <RestaurantsClient initialItems={data?.items ?? []} initialTotal={data?.total ?? 0} />
    </div>
  );
}
