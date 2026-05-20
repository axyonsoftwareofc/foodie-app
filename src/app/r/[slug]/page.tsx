// src/app/r/[slug]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
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

export default async function RestaurantPage({
                                                 params,
                                             }: {
    params: Promise<{ slug: string }>;
}) {
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
