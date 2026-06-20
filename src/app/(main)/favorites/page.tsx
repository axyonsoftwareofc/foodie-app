// src/app/favorites/page.tsx
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFavorites } from '@/hooks/useFavorites';
import { restaurants } from '@/data/mock';
import RestaurantCard from '@/components/home/RestaurantCard';
import BottomNav from '@/components/layout/BottomNav';

export default function FavoritesPage() {
  const { favorites, isHydrated } = useFavorites();

  const favoriteRestaurants = useMemo(() => {
    return restaurants.filter((r) => favorites.includes(r.id));
  }, [favorites]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold">Favoritos</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {!isHydrated ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-[#00A082] border-t-transparent rounded-full" />
          </div>
        ) : favoriteRestaurants.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {favoriteRestaurants.map((restaurant, index) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} index={index} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart size={40} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">Nenhum favorito ainda</h2>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Toque no coração nos restaurantes para salvá-los aqui
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-[#00A082] text-white rounded-full font-semibold hover:bg-[#008F74] transition-colors"
            >
              Explorar restaurantes
            </Link>
          </motion.div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
