// src/lib/constants/filter.constants.ts
export interface FilterOption {
  value: string;
  label: string;
}

export const SORT_OPTIONS: FilterOption[] = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'rating', label: 'Melhor avaliação' },
  { value: 'delivery_time', label: 'Mais rápido' },
  { value: 'delivery_fee', label: 'Menor taxa' },
];

export const RATING_OPTIONS: FilterOption[] = [
  { value: '4.5', label: '4.5+' },
  { value: '4.0', label: '4.0+' },
  { value: '3.5', label: '3.5+' },
];

export const PRICE_OPTIONS: FilterOption[] = [
  { value: 'free', label: 'Entrega Grátis' },
  { value: 'low', label: 'Até R$ 5' },
  { value: 'medium', label: 'Até R$ 10' },
];

export interface ActiveFilters {
  search: string;
  category: string | null;
  sortBy: string;
  minRating: number | null;
  maxDeliveryFee: number | null;
  freeDeliveryOnly: boolean;
}

export const DEFAULT_FILTERS: ActiveFilters = {
  search: '',
  category: null,
  sortBy: 'relevance',
  minRating: null,
  maxDeliveryFee: null,
  freeDeliveryOnly: false,
};
