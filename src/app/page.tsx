// src/app/page.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PromoBanner from '@/components/home/PromoBanner';
import SearchBar from '@/components/home/SearchBar';
import FilterBar from '@/components/home/FilterBar';
import RestaurantCard from '@/components/home/RestaurantCard';
import { RestaurantCardSkeleton } from '@/components/ui/Skeleton';
import { restaurants as mockRestaurants } from '@/data/mock';
import { getPublicRestaurants } from '@/actions/restaurantActions';
import { useFilters } from '@/hooks/useFilters';
import { ActiveFilters } from '@/lib/constants/filter.constants';
import type { Restaurant } from '@/types';

export default function HomePage() {
    const [isLoading, setIsLoading] = useState(false);
    const [dataRestaurants, setDataRestaurants] = useState<Restaurant[] | null>(null);
    const restaurants = dataRestaurants ?? mockRestaurants;
    const { filters, updateFilter, resetFilters, filteredRestaurants, hasActiveFilters } = useFilters(restaurants);

    useEffect(() => {
        let cancelled = false;
        getPublicRestaurants().then((result) => {
            if (!cancelled && result.data) {
                setDataRestaurants(result.data);
            }
        });
        return () => { cancelled = true; };
    }, []);

    const handleFilterChange = useCallback(<K extends keyof ActiveFilters>(
        key: K,
        value: ActiveFilters[K]
    ): void => {
        setIsLoading(true);
        updateFilter(key, value);
        setTimeout(() => setIsLoading(false), 300);
    }, [updateFilter]);

    const handleSearchChange = useCallback((value: string): void => {
        updateFilter('search', value);
    }, [updateFilter]);

    const handleReset = useCallback((): void => {
        setIsLoading(true);
        resetFilters();
        setTimeout(() => setIsLoading(false), 300);
    }, [resetFilters]);

    return (
        <div
            className="transition-colors"
            style={{ backgroundColor: 'var(--color-bg-secondary)' }}
        >
            <div className="max-w-7xl mx-auto px-4 py-4">
                {/* Busca */}
                <div className="mb-4">
                    <SearchBar
                        value={filters.search}
                        onChange={handleSearchChange}
                    />
                </div>

                {/* Banner */}
                <AnimatePresence>
                    {!filters.search && !hasActiveFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <PromoBanner />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Filtros */}
                <div className="my-6">
                    <FilterBar
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onReset={handleReset}
                        hasActiveFilters={hasActiveFilters}
                    />
                </div>

                {/* Resultados */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2
                            className="text-xl font-bold"
                            style={{ color: 'var(--color-text)' }}
                        >
                            {filters.search
                                ? `Resultados para "${filters.search}"`
                                : filters.category
                                    ? filters.category
                                    : 'Restaurantes'}
                        </h2>
                        <span style={{ color: 'var(--color-text-secondary)' }} className="text-sm">
                            {filteredRestaurants.length} encontrados
                        </span>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <RestaurantCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : filteredRestaurants.length > 0 ? (
                        <motion.div
                            layout
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        >
                            <AnimatePresence mode="popLayout">
                                {filteredRestaurants.map((restaurant, index) => (
                                    <RestaurantCard
                                        key={restaurant.id}
                                        restaurant={restaurant}
                                        index={index}
                                    />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-16"
                        >
                            <div className="text-6xl mb-4">🔍</div>
                            <h3
                                className="text-xl font-semibold mb-2"
                                style={{ color: 'var(--color-text)' }}
                            >
                                Nenhum restaurante encontrado
                            </h3>
                            <p style={{ color: 'var(--color-text-secondary)' }} className="mb-6">
                                Tente ajustar seus filtros ou buscar por outro termo
                            </p>
                            <button
                                onClick={handleReset}
                                className="px-6 py-3 bg-[#00A082] text-white rounded-full font-semibold hover:bg-[#008F74] transition-colors"
                            >
                                Limpar filtros
                            </button>
                        </motion.div>
                    )}
                </section>
            </div>
        </div>
    );
}