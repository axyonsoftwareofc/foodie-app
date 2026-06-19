// src/scripts/seed-products.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const mockProducts = [
  // ============================================
  // BURGER KING (restaurantId: '1')
  // ============================================
  {
    id: '101',
    restaurantId: '1',
    categoryName: 'Burgers',
    name: 'Whopper',
    description: 'Pão, carne grelhada, queijo, alface, tomate, cebola, picles e maionese',
    price: 28.9,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300',
    popular: true,
  },
  {
    id: '102',
    restaurantId: '1',
    categoryName: 'Burgers',
    name: 'Whopper Duplo',
    description: 'Duas carnes grelhadas, queijo, alface, tomate, cebola, picles e maionese',
    price: 35.9,
    image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=300',
    popular: true,
  },
  {
    id: '103',
    restaurantId: '1',
    categoryName: 'Burgers',
    name: 'Chicken Crispy',
    description: 'Frango empanado crocante com maionese especial e alface',
    price: 24.9,
    image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=300',
    popular: false,
  },
  {
    id: '104',
    restaurantId: '1',
    categoryName: 'Acompanhamentos',
    name: 'Batata Frita M',
    description: 'Porção média de batatas fritas crocantes',
    price: 12.9,
    image: 'https://images.unsplash.com/photo-1630384060421-cb20aff8c59e?w=300',
    popular: false,
  },
  {
    id: '105',
    restaurantId: '1',
    categoryName: 'Acompanhamentos',
    name: 'Batata Frita G',
    description: 'Porção grande de batatas fritas crocantes',
    price: 15.9,
    image: 'https://images.unsplash.com/photo-1630384060421-cb20aff8c59e?w=300',
    popular: false,
  },
  {
    id: '106',
    restaurantId: '1',
    categoryName: 'Acompanhamentos',
    name: 'Onion Rings',
    description: 'Anéis de cebola empanados e crocantes',
    price: 14.9,
    image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=300',
    popular: false,
  },
  {
    id: '107',
    restaurantId: '1',
    categoryName: 'Bebidas',
    name: 'Coca-Cola 350ml',
    description: 'Refrigerante Coca-Cola lata',
    price: 6.9,
    image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=300',
    popular: false,
  },
  {
    id: '108',
    restaurantId: '1',
    categoryName: 'Bebidas',
    name: 'Milk Shake Chocolate',
    description: 'Milk shake cremoso sabor chocolate',
    price: 16.9,
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300',
    popular: true,
  },

  // ============================================
  // PIZZA HUT (restaurantId: '2')
  // ============================================
  {
    id: '201',
    restaurantId: '2',
    categoryName: 'Pizzas Tradicionais',
    name: 'Pizza Pepperoni',
    description: 'Molho de tomate, mussarela e pepperoni',
    price: 49.9,
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=300',
    popular: true,
  },
  {
    id: '202',
    restaurantId: '2',
    categoryName: 'Pizzas Tradicionais',
    name: 'Pizza Margherita',
    description: 'Molho de tomate, mussarela, tomate e manjericão fresco',
    price: 44.9,
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300',
    popular: false,
  },
  {
    id: '203',
    restaurantId: '2',
    categoryName: 'Pizzas Especiais',
    name: 'Pizza Quatro Queijos',
    description: 'Mussarela, parmesão, gorgonzola e catupiry',
    price: 54.9,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300',
    popular: true,
  },
  {
    id: '204',
    restaurantId: '2',
    categoryName: 'Pizzas Tradicionais',
    name: 'Pizza Calabresa',
    description: 'Molho de tomate, mussarela e calabresa fatiada',
    price: 42.9,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300',
    popular: false,
  },
  {
    id: '205',
    restaurantId: '2',
    categoryName: 'Bebidas',
    name: 'Refrigerante 2L',
    description: 'Coca-Cola, Guaraná ou Fanta',
    price: 12.9,
    image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=300',
    popular: false,
  },

  // ============================================
  // SUSHI NOW (restaurantId: '3')
  // ============================================
  {
    id: '301',
    restaurantId: '3',
    categoryName: 'Combinados',
    name: 'Combinado 20 peças',
    description: '10 sushis, 5 sashimis e 5 hot rolls',
    price: 79.9,
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=300',
    popular: true,
  },
  {
    id: '302',
    restaurantId: '3',
    categoryName: 'Hot Rolls',
    name: 'Hot Roll Salmão',
    description: '8 peças de hot roll com salmão e cream cheese',
    price: 32.9,
    image: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=300',
    popular: true,
  },
  {
    id: '303',
    restaurantId: '3',
    categoryName: 'Sashimis',
    name: 'Sashimi de Salmão',
    description: '10 fatias de salmão fresco',
    price: 45.9,
    image: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=300',
    popular: false,
  },
  {
    id: '304',
    restaurantId: '3',
    categoryName: 'Temakis',
    name: 'Temaki Salmão',
    description: 'Temaki de salmão com cream cheese e cebolinha',
    price: 24.9,
    image: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=300',
    popular: false,
  },

  // ============================================
  // SALAD & CO (restaurantId: '4')
  // ============================================
  {
    id: '401',
    restaurantId: '4',
    categoryName: 'Saladas',
    name: 'Salada Caesar',
    description: 'Alface americana, croutons, parmesão e molho caesar',
    price: 29.9,
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=300',
    popular: true,
  },
  {
    id: '402',
    restaurantId: '4',
    categoryName: 'Bowls',
    name: 'Bowl Proteico',
    description: 'Frango grelhado, quinoa, legumes e molho tahine',
    price: 34.9,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300',
    popular: true,
  },
  {
    id: '403',
    restaurantId: '4',
    categoryName: 'Wraps',
    name: 'Wrap Integral',
    description: 'Wrap integral com frango, alface, tomate e maionese light',
    price: 22.9,
    image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=300',
    popular: false,
  },
  {
    id: '404',
    restaurantId: '4',
    categoryName: 'Bebidas',
    name: 'Suco Verde Detox',
    description: 'Couve, maçã verde, gengibre e limão',
    price: 14.9,
    image: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=300',
    popular: false,
  },

  // ============================================
  // AÇAÍ DA SERRA (restaurantId: '5')
  // ============================================
  {
    id: '501',
    restaurantId: '5',
    categoryName: 'Açaí',
    name: 'Açaí 500ml',
    description: 'Açaí cremoso com banana, granola e leite condensado',
    price: 22.9,
    image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=300',
    popular: true,
  },
  {
    id: '502',
    restaurantId: '5',
    categoryName: 'Açaí',
    name: 'Açaí 700ml',
    description: 'Açaí cremoso com banana, granola e leite condensado',
    price: 28.9,
    image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=300',
    popular: false,
  },
  {
    id: '503',
    restaurantId: '5',
    categoryName: 'Açaí Premium',
    name: 'Açaí Premium',
    description: 'Açaí com morango, kiwi, granola, leite condensado e nutella',
    price: 34.9,
    image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=300',
    popular: true,
  },
  {
    id: '504',
    restaurantId: '5',
    categoryName: 'Adicionais',
    name: 'Adicional Nutella',
    description: 'Porção extra de Nutella',
    price: 5.9,
    image: 'https://images.unsplash.com/photo-1604514628550-37477afdf4e3?w=300',
    popular: false,
  },

  // ============================================
  // CANTINA ITALIANA (restaurantId: '6')
  // ============================================
  {
    id: '601',
    restaurantId: '6',
    categoryName: 'Massas',
    name: 'Lasanha Bolonhesa',
    description: 'Lasanha tradicional com molho bolonhesa e queijo gratinado',
    price: 42.9,
    image: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=300',
    popular: true,
  },
  {
    id: '602',
    restaurantId: '6',
    categoryName: 'Massas',
    name: 'Espaguete Carbonara',
    description: 'Espaguete com molho carbonara, bacon crocante e parmesão',
    price: 38.9,
    image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=300',
    popular: true,
  },
  {
    id: '603',
    restaurantId: '6',
    categoryName: 'Risotos',
    name: 'Risoto de Funghi',
    description: 'Risoto cremoso com mix de cogumelos e parmesão',
    price: 45.9,
    image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=300',
    popular: false,
  },
  {
    id: '604',
    restaurantId: '6',
    categoryName: 'Sobremesas',
    name: 'Tiramisu',
    description: 'Sobremesa italiana com café, mascarpone e cacau',
    price: 18.9,
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300',
    popular: false,
  },
];

function getCategoryId(restaurantId: string, categoryName: string): string {
  return `${restaurantId}-${categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
}

async function main() {
  console.log('🌱 Populando categorias e produtos...');

  const categoryIds = new Map<string, string>();

  for (const product of mockProducts) {
    const categoryId = getCategoryId(product.restaurantId, product.categoryName);

    if (!categoryIds.has(categoryId)) {
      await prisma.category.upsert({
        where: { id: categoryId },
        update: {
          name: product.categoryName,
          restaurant_id: product.restaurantId,
          is_active: true,
        },
        create: {
          id: categoryId,
          name: product.categoryName,
          restaurant_id: product.restaurantId,
          is_active: true,
        },
      });
      categoryIds.set(categoryId, categoryId);
      console.log(`  📂 Categoria: ${product.categoryName} (${product.restaurantId})`);
    }

    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        restaurant_id: product.restaurantId,
        category_id: categoryId,
        is_available: true,
        is_active: true,
        badges: product.popular ? ['popular'] : [],
      },
      create: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        restaurant_id: product.restaurantId,
        category_id: categoryId,
        is_available: true,
        is_active: true,
        badges: product.popular ? ['popular'] : [],
      },
    });
    console.log(`  ✅ ${product.name}`);
  }

  console.log('🎉 Produtos criados com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
