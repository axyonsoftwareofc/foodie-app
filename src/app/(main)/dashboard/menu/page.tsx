// src/app/dashboard/menu/page.tsx
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CategoryForm } from './CategoryForm';
import { SortableCategoryList } from './SortableCategoryList';

export default async function MenuPage() {
  const session = await requireAuth();
  const restaurant = await prisma.restaurant.findFirst({
    where: {
      user_id: session.user.id,
      is_active: true,
    },
    select: { id: true },
  });

  if (!restaurant) {
    redirect('/register');
  }

  const categories = await prisma.category.findMany({
    where: {
      restaurant_id: restaurant.id,
      is_active: true,
    },
    orderBy: { sort_order: 'asc' },
    include: {
      products: {
        where: { is_active: true },
        orderBy: { name: 'asc' },
      },
    },
  });

  const mappedCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    restaurantId: c.restaurant_id,
    products: c.products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      isAvailable: p.is_available,
    })),
  }));

  return (
    <div className="max-w-4xl pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Seu Cardapio</h1>
        <p className="text-gray-500 mt-1">
          Gerencie suas categorias e produtos. Arraste para reordenar.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-200 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Adicionar Categoria</h2>
          <CategoryForm />
        </div>

        <div className="p-0">
          {categories.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nenhuma categoria criada ainda. Crie a primeira acima!
            </div>
          ) : (
            <SortableCategoryList categories={mappedCategories} restaurantId={restaurant.id} />
          )}
        </div>
      </div>
    </div>
  );
}
