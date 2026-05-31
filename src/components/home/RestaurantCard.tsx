// src/components/home/RestaurantCard.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Restaurant } from '@/types';
import { formatPrice } from '@/lib/utils/format.utils';
import { useFavorites } from '@/hooks/useFavorites';

interface RestaurantCardProps {
  restaurant: Restaurant;
  index?: number;
}

export default function RestaurantCard({ restaurant, index = 0 }: RestaurantCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const {
    id,
    name,
    image,
    rating,
    deliveryTime,
    deliveryFee,
    category,
    promoted,
    isOpen = true,
  } = restaurant;

  const handleFavoriteClick = (e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();

    const newState = toggleFavorite(id);

    if (newState) {
      toast.success(`${name} adicionado aos favoritos`, { icon: '❤️' });
    } else {
      toast.info(`${name} removido dos favoritos`);
    }
  };

  const favorite = isFavorite(id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link href={`/restaurant/${id}`}>
        <article
          className={`rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group relative ${
            !isOpen ? 'opacity-60' : ''
          }`}
          style={{
            backgroundColor: 'var(--color-bg-card)',
            borderColor: 'var(--color-border)',
            borderWidth: '1px',
          }}
        >
          {/* Imagem */}
          <div
            className="relative h-40 overflow-hidden"
            style={{ backgroundColor: 'var(--color-bg-secondary)' }}
          >
            {!isImageLoaded && (
              <div
                className="absolute inset-0 animate-pulse"
                style={{ backgroundColor: 'var(--color-bg-secondary)' }}
              />
            )}
            <Image
              src={image}
              alt={name}
              fill
              className={`object-cover group-hover:scale-105 transition-transform duration-300 ${
                isImageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setIsImageLoaded(true)}
            />

            {/* Badges */}
            {promoted && (
              <span className="absolute top-3 left-3 bg-[#00A082] text-white text-xs px-2 py-1 rounded-full font-medium">
                Patrocinado
              </span>
            )}
            {deliveryFee === 0 && (
              <span className="absolute top-3 right-12 bg-[#1A1A1A] text-white text-xs px-2 py-1 rounded-full font-medium">
                Entrega Grátis
              </span>
            )}
            {!isOpen && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="bg-white text-gray-900 px-4 py-2 rounded-full font-medium">
                  Fechado
                </span>
              </div>
            )}

            {/* Botão Favorito */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleFavoriteClick}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow z-10"
              style={{ backgroundColor: 'var(--color-bg-card)' }}
              aria-label={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Heart
                size={18}
                className={favorite ? 'fill-red-500 text-red-500' : ''}
                style={{ color: favorite ? undefined : 'var(--color-text-secondary)' }}
              />
            </motion.button>
          </div>

          {/* Info */}
          <div className="p-4">
            <h3
              className="font-semibold text-lg mb-1 truncate"
              style={{ color: 'var(--color-text)' }}
            >
              {name}
            </h3>

            <div
              className="flex items-center gap-3 text-sm"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <div className="flex items-center gap-1">
                <Star size={16} className="text-yellow-400 fill-yellow-400" />
                <span style={{ color: 'var(--color-text)' }} className="font-medium">
                  {rating}
                </span>
              </div>
              <span>•</span>
              <span>{deliveryTime}</span>
              <span>•</span>
              <span>{formatPrice(deliveryFee)}</span>
            </div>

            <span
              className="inline-block mt-2 text-xs px-2 py-1 rounded-full"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {category}
            </span>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}
