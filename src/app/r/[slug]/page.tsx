// src/app/r/[slug]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { RestaurantHeader } from "@/components/restaurant/RestaurantHeader";
import { MenuSection } from "@/components/restaurant/MenuSection";
import { getCssVariables, DEFAULT_THEME, type RestaurantTheme } from "@/lib/theme/resolver";

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

    const restaurantData = await prisma.restaurant.findUnique({
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

    if (!restaurantData || !restaurantData.is_active) {
        notFound();
    }

    const theme = parseTheme(restaurantData.theme)
    const cssVars = getCssVariables(theme)

    const restaurant = {
        ...restaurantData,
        categories: restaurantData.categories.map(category => ({
            id: category.id,
            name: category.name,
            restaurantId: category.restaurant_id,
            products: category.products.map(product => ({
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
            <RestaurantHeader restaurant={restaurantData} />
            <MenuSection categories={restaurant.categories} />
        </div>
    );
}
