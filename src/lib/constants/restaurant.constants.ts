// src/lib/constants/restaurant.constants.ts
import { Category } from '@/types';

export const CATEGORIES: Category[] = [
  { id: '1', name: 'Pizza', icon: '🍕' },
  { id: '2', name: 'Burger', icon: '🍔' },
  { id: '3', name: 'Japonesa', icon: '🍣' },
  { id: '4', name: 'Saudável', icon: '🥗' },
  { id: '5', name: 'Doces', icon: '🍰' },
  { id: '6', name: 'Brasileira', icon: '🍛' },
  { id: '7', name: 'Italiana', icon: '🍝' },
  { id: '8', name: 'Açaí', icon: '🫐' },
];

export const RESTAURANT_FILTERS = {
  sortOptions: [
    { value: 'relevance', label: 'Relevância' },
    { value: 'rating', label: 'Melhor avaliação' },
    { value: 'deliveryTime', label: 'Tempo de entrega' },
    { value: 'deliveryFee', label: 'Taxa de entrega' },
  ],
  ratingOptions: [
    { value: 4.5, label: '4.5+' },
    { value: 4.0, label: '4.0+' },
    { value: 3.5, label: '3.5+' },
  ],
} as const;
