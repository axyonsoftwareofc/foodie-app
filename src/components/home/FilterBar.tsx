// src/components/home/FilterBar.tsx
'use client';

import { X, Star, Bike } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActiveFilters } from '@/lib/constants/filter.constants';
import { CATEGORIES } from '@/lib/constants/restaurant.constants';

interface FilterBarProps {
  filters: ActiveFilters;
  onFilterChange: <K extends keyof ActiveFilters>(key: K, value: ActiveFilters[K]) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

export default function FilterBar({
  filters,
  onFilterChange,
  onReset,
  hasActiveFilters,
}: FilterBarProps) {
  const inactiveButtonStyle = {
    backgroundColor: 'var(--color-bg-card)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text)',
  };

  return (
    <div className="space-y-4">
      {/* Filtros rápidos */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {/* Ordenação */}
        <select
          value={filters.sortBy}
          onChange={(e) => onFilterChange('sortBy', e.target.value)}
          className="px-4 py-2 border rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00A082] cursor-pointer transition-colors"
          style={inactiveButtonStyle}
        >
          <option value="relevance">Relevância</option>
          <option value="rating">Melhor avaliação</option>
          <option value="delivery_time">Mais rápido</option>
          <option value="delivery_fee">Menor taxa</option>
        </select>

        {/* Entrega Grátis */}
        <button
          onClick={() => onFilterChange('freeDeliveryOnly', !filters.freeDeliveryOnly)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
            filters.freeDeliveryOnly ? 'bg-[#00A082] text-white border-[#00A082]' : ''
          }`}
          style={filters.freeDeliveryOnly ? undefined : inactiveButtonStyle}
        >
          <Bike size={16} />
          Entrega Grátis
        </button>

        {/* Rating 4.5+ */}
        <button
          onClick={() => onFilterChange('minRating', filters.minRating === 4.5 ? null : 4.5)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
            filters.minRating === 4.5 ? 'bg-[#00A082] text-white border-[#00A082]' : ''
          }`}
          style={filters.minRating === 4.5 ? undefined : inactiveButtonStyle}
        >
          <Star size={16} />
          4.5+
        </button>

        {/* Limpar filtros */}
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={onReset}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border"
              style={{
                backgroundColor: 'var(--color-error-light)',
                borderColor: 'var(--color-error-border)',
                color: 'var(--color-error)',
              }}
            >
              <X size={16} />
              Limpar
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Categorias */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => onFilterChange('category', null)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            filters.category === null ? 'bg-[#00A082] text-white' : ''
          }`}
          style={
            filters.category === null
              ? undefined
              : {
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text)',
                }
          }
        >
          Todos
        </button>
        {CATEGORIES.map((category) => {
          const isActive = filters.category === category.name;

          return (
            <button
              key={category.id}
              onClick={() => onFilterChange('category', isActive ? null : category.name)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                isActive ? 'bg-[#00A082] text-white' : ''
              }`}
              style={
                isActive
                  ? undefined
                  : {
                      backgroundColor: 'var(--color-bg-secondary)',
                      color: 'var(--color-text)',
                    }
              }
            >
              <span>{category.icon}</span>
              {category.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
