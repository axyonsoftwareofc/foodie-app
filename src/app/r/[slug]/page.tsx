// src/app/r/[slug]/page.tsx
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { cache } from 'react';
import { RestaurantHeader } from '@/components/restaurant/RestaurantHeader';
import { MenuSection } from '@/components/restaurant/MenuSection';
import { getCssVariables, DEFAULT_THEME, type RestaurantTheme } from '@/lib/theme/resolver';
import { getCachedMenu, setCachedMenu } from '@/lib/cache/menu-cache';
import { WhatsAppButton } from '@/components/restaurant/WhatsAppButton';

function parseTheme(raw: unknown): RestaurantTheme {
  if (!raw) return DEFAULT_THEME;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (typeof parsed !== 'object' || !parsed) return DEFAULT_THEME;
    return { ...DEFAULT_THEME, ...parsed };
  } catch {
    return DEFAULT_THEME;
  }
}

interface Props {
  params: Promise<{ slug: string }>;
}

// ISR: revalida a cada 60 segundos
export const revalidate = 60;

export async function generateStaticParams() {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  try {
    const restaurants = await prisma.restaurant.findMany({
      where: { is_active: true },
      select: { subdomain: true },
      take: 100,
    });
    return restaurants
      .filter((r): r is typeof r & { subdomain: string } => !!r.subdomain)
      .map((r) => ({ slug: r.subdomain }));
  } catch (error) {
    // Banco indisponível no build não deve derrubar o deploy — as páginas são
    // geradas sob demanda via ISR (revalidate = 60).
    console.warn(
      '[generateStaticParams] Falha ao consultar restaurantes; gerando sob demanda.',
      error
    );
    return [];
  }
}

const getRestaurantData = cache(async (slug: string) => {
  const cached = await getCachedMenu(slug);

  if (cached && cached.restaurant) {
    return {
      restaurantData: cached.restaurant,
      categoriesData: (cached.categories || []) as Record<string, unknown>[],
    };
  }

  const data = await prisma.restaurant.findUnique({
    where: { subdomain: slug },
    include: {
      categories: {
        where: { is_active: true },
        include: {
          products: {
            where: { is_active: true, is_available: true },
            orderBy: { name: 'asc' },
          },
        },
        orderBy: { sort_order: 'asc' },
      },
    },
  });

  if (!data || !data.is_active) {
    return null;
  }

  const categoriesData = (data.categories as unknown as Record<string, unknown>[]) || [];
  const restaurantData = data as unknown as Record<string, unknown>;

  void setCachedMenu(slug, {
    restaurant: restaurantData,
    categories: categoriesData,
  });

  return { restaurantData, categoriesData };
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getRestaurantData(slug);

  if (!data) {
    return { title: 'Restaurante nao encontrado — Foodie' };
  }

  const r = data.restaurantData as Record<string, string | null>;
  const title = `${r.name} — Delivery no Foodie`;
  const description =
    (r.description as string) ||
    `Peca delivery do ${r.name}. ${(r.category as string) || 'Comida deliciosa'} entregue na sua casa.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: r.logo ? [{ url: r.logo as string }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: r.logo ? [r.logo as string] : [],
    },
  };
}

export default async function RestaurantPage({ params }: Props) {
  const { slug } = await params;

  const data = await getRestaurantData(slug);

  if (!data) {
    notFound();
  }

  const { restaurantData, categoriesData } = data;

  if (!(restaurantData as Record<string, boolean>).is_active) {
    notFound();
  }

  const theme = parseTheme(restaurantData.theme);
  const cssVars = getCssVariables(theme);

  const restaurant = {
    ...restaurantData,
    categories: categoriesData.map((category: Record<string, unknown>) => ({
      id: category.id,
      name: category.name,
      restaurantId: category.restaurant_id,
      products: ((category.products as Array<Record<string, unknown>>) || []).map(
        (product: Record<string, unknown>) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          imageUrl: product.image,
          isAvailable: product.is_available,
          restaurantId: product.restaurant_id,
        })
      ),
    })),
  };

  return (
    <div
      className="min-h-screen pb-28"
      style={{
        backgroundColor: cssVars['--restaurant-bg'],
        fontFamily: cssVars['--restaurant-font-body'],
      }}
    >
      <RestaurantHeader restaurant={restaurantData as never} />
      <MenuSection categories={restaurant.categories as never} />
      <WhatsAppButton
        phone={(restaurantData as Record<string, string>).phone || ''}
        message={`Ola! Gostaria de fazer um pedido no ${(restaurantData as Record<string, string>).name || 'restaurante'}.`}
      />
    </div>
  );
}
