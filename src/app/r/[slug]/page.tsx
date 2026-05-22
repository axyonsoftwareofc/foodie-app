// src/app/r/[slug]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { RestaurantHeader } from "@/components/restaurant/RestaurantHeader";
import { MenuSection } from "@/components/restaurant/MenuSection";
import { getCssVariables, DEFAULT_THEME, type RestaurantTheme } from "@/lib/theme/resolver";
import { redisGet, redisSet, cacheKey } from "@/lib/redis";

function parseTheme(raw: unknown): RestaurantTheme {
    if (!raw) return DEFAULT_THEME
    try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
        if (typeof parsed !== 'object' || !parsed) return DEFAULT_THEME
        return { ...DEFAULT_THEME, ...parsed }
    } catch {
        return DEFAULT_THEME
    }
}

interface Props {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params

    const restaurant = await prisma.restaurant.findUnique({
        where: { subdomain: slug },
        select: { name: true, description: true, logo: true, category: true },
    })

    if (!restaurant) {
        return { title: 'Restaurante nao encontrado — Foodie' }
    }

    const title = `${restaurant.name} — Delivery no Foodie`
    const description = restaurant.description || `Peca delivery do ${restaurant.name}. ${restaurant.category || 'Comida deliciosa'} entregue na sua casa.`

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'website',
            images: restaurant.logo ? [{ url: restaurant.logo }] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: restaurant.logo ? [restaurant.logo] : [],
        },
    }
}

export default async function RestaurantPage({ params }: Props) {
    const { slug } = await params;

    // Cache: tenta Redis primeiro
    const CACHE_KEY = cacheKey('menu', 'slug', slug)
    const cachedRaw = await redisGet<Record<string, unknown>>(CACHE_KEY)

    let restaurantData: Record<string, unknown> | null = null

    if (cachedRaw) {
        restaurantData = cachedRaw
    } else {
        const data = await prisma.restaurant.findUnique({
            where: { subdomain: slug },
            include: {
                categories: {
                    where: { is_active: true },
                    include: {
                        products: {
                            where: { is_active: true, is_available: true },
                            orderBy: { name: "asc" },
                        },
                    },
                    orderBy: { sort_order: "asc" },
                },
            },
        });

        if (!data || !data.is_active) {
            notFound();
        }

        // Salva no Redis (TTL 5 min)
        void redisSet(CACHE_KEY, data as unknown as Record<string, unknown>, 300)

        restaurantData = data as unknown as Record<string, unknown>
    }

    if (!restaurantData || !(restaurantData as Record<string, boolean>).is_active) {
        notFound();
    }

    const theme = parseTheme((restaurantData as Record<string, unknown>).theme)
    const cssVars = getCssVariables(theme)

    const cats = (restaurantData as Record<string, unknown>).categories as Array<Record<string, unknown>>
    const restaurant = {
        ...restaurantData,
        categories: cats.map((category: Record<string, unknown>) => ({
            id: category.id,
            name: category.name,
            restaurantId: category.restaurant_id,
            products: ((category.products as Array<Record<string, unknown>>) || []).map((product: Record<string, unknown>) => ({
                id: product.id,
                name: product.name,
                description: product.description,
                price: product.price,
                imageUrl: product.image,
                isAvailable: product.is_available,
                restaurantId: product.restaurant_id,
            }))
        }))
    };

    return (
        <div className="min-h-screen pb-28" style={{
            backgroundColor: cssVars['--restaurant-bg'],
            fontFamily: cssVars['--restaurant-font-body'],
        }}>
            <RestaurantHeader restaurant={restaurantData as never} />
            <MenuSection categories={restaurant.categories as never} />
        </div>
    );
}
