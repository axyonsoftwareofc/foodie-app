// src/components/home/RestaurantList.tsx
import { Restaurant } from '@/types';
import RestaurantCard from './RestaurantCard';

interface RestaurantListProps {
  title: string;
  restaurants: Restaurant[];
  showViewAll?: boolean;
}

export default function RestaurantList({
  title,
  restaurants,
  showViewAll = true,
}: RestaurantListProps) {
  if (restaurants.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        {showViewAll && (
          <button className="text-[#00A082] font-medium hover:underline">Ver todos</button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {restaurants.map((restaurant) => (
          <RestaurantCard key={restaurant.id} restaurant={restaurant} />
        ))}
      </div>
    </section>
  );
}
