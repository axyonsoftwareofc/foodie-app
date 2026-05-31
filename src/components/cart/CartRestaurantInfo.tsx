// src/components/cart/CartRestaurantInfo.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Clock, ChevronRight } from 'lucide-react';
import { Restaurant } from '@/types';

interface CartRestaurantInfoProps {
  restaurant: Restaurant;
}

export default function CartRestaurantInfo({ restaurant }: CartRestaurantInfoProps) {
  return (
    <Link
      href={`/restaurant/${restaurant.id}`}
      className="flex items-center gap-4 p-4 rounded-2xl border transition-colors"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
        <Image src={restaurant.image} alt={restaurant.name} fill className="object-cover" />
      </div>

      <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-lg truncate" style={{ color: 'var(--color-text)' }}>
          {restaurant.name}
        </h2>
        <div
          className="flex items-center gap-2 text-sm mt-1"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <Clock size={16} />
          <span>{restaurant.deliveryTime}</span>
        </div>
      </div>

      <ChevronRight size={24} style={{ color: 'var(--color-text-secondary)' }} />
    </Link>
  );
}
