// src/lib/menu-templates.ts
export interface MenuTemplateItem {
  name: string;
  description: string;
  price: number;
  image?: string;
}

export interface MenuTemplateCategory {
  name: string;
  items: MenuTemplateItem[];
}

export interface MenuTemplate {
  id: string;
  label: string;
  categories: MenuTemplateCategory[];
}

export const MENU_TEMPLATES: Record<string, MenuTemplate> = {
  pizzaria: {
    id: 'pizzaria',
    label: 'Pizzaria',
    categories: [
      {
        name: 'Pizzas Salgadas',
        items: [
          {
            name: 'Margherita',
            description: 'Molho de tomate, mussarela, manjericão fresco e tomate',
            price: 38.9,
          },
          {
            name: 'Calabresa',
            description: 'Molho de tomate, mussarela, calabresa fatiada e cebola',
            price: 42.9,
          },
          {
            name: 'Portuguesa',
            description: 'Molho de tomate, mussarela, presunto, ovos, cebola, pimentão e azeitonas',
            price: 45.9,
          },
          {
            name: 'Frango com Catupiry',
            description: 'Molho de tomate, mussarela, frango desfiado e catupiry',
            price: 46.9,
          },
          {
            name: 'Quatro Queijos',
            description: 'Molho de tomate, mussarela, provolone, gorgonzola e parmesão',
            price: 48.9,
          },
          {
            name: 'Pepperoni',
            description: 'Molho de tomate, mussarela e pepperoni fatiado',
            price: 44.9,
          },
        ],
      },
      {
        name: 'Pizzas Doces',
        items: [
          {
            name: 'Chocolate com Morango',
            description: 'Chocolate derretido, morangos frescos e leite condensado',
            price: 39.9,
          },
          {
            name: 'Banana com Canela',
            description: 'Banana caramelizada, canela e leite condensado',
            price: 35.9,
          },
        ],
      },
      {
        name: 'Bebidas',
        items: [
          {
            name: 'Refrigerante Lata',
            description: 'Coca-Cola, Guaraná ou Fanta (350ml)',
            price: 8.0,
          },
          { name: 'Água Mineral', description: 'Sem gás (500ml)', price: 5.0 },
          { name: 'Suco Natural', description: 'Laranja, limão ou maracujá (300ml)', price: 12.0 },
        ],
      },
    ],
  },
  hamburgueria: {
    id: 'hamburgueria',
    label: 'Hamburgueria',
    categories: [
      {
        name: 'Burgers',
        items: [
          {
            name: 'Classic Burger',
            description: 'Pão brioche, carne 180g, queijo, alface e tomate',
            price: 28.9,
          },
          {
            name: 'Cheese Bacon',
            description:
              'Pão brioche, carne 180g, queijo cheddar, bacon crocante e cebola caramelizada',
            price: 34.9,
          },
          {
            name: 'Chicken Crispy',
            description: 'Pão brioche, frango empanado, alface, tomate e maionese especial',
            price: 26.9,
          },
          {
            name: 'Veggie Burger',
            description: 'Pão integral, hambúrguer de grão-de-bico, rúcula, tomate seco e pesto',
            price: 32.9,
          },
          {
            name: 'Double Smash',
            description: 'Pão brioche, duas carnes smash 100g, queijo duplo e molho especial',
            price: 36.9,
          },
        ],
      },
      {
        name: 'Acompanhamentos',
        items: [
          {
            name: 'Batata Frita',
            description: 'Porção individual com molho barbecue',
            price: 16.9,
          },
          {
            name: 'Onion Rings',
            description: 'Anéis de cebola empanados com molho ranch',
            price: 18.9,
          },
          {
            name: 'Batata Rústica',
            description: 'Temperada com alecrim e páprica',
            price: 19.9,
          },
        ],
      },
      {
        name: 'Bebidas',
        items: [
          {
            name: 'Refrigerante Lata',
            description: 'Coca-Cola, Guaraná ou Fanta (350ml)',
            price: 8.0,
          },
          { name: 'Milkshake', description: 'Chocolate, morango ou baunilha (400ml)', price: 18.9 },
          { name: 'Água Mineral', description: 'Sem gás (500ml)', price: 5.0 },
        ],
      },
    ],
  },
  japonesa: {
    id: 'japonesa',
    label: 'Japonesa',
    categories: [
      {
        name: 'Sushi',
        items: [
          {
            name: 'Salmão (8 peças)',
            description: 'Salmão fresco sobre arroz temperado',
            price: 42.9,
          },
          { name: 'Atum (8 peças)', description: 'Atum fresco sobre arroz temperado', price: 44.9 },
          {
            name: 'Uramaki Filadélfia (8 peças)',
            description: 'Salmão, cream cheese e cebolinha',
            price: 38.9,
          },
          {
            name: 'Hot Roll (8 peças)',
            description: 'Salmão empanado com cream cheese',
            price: 35.9,
          },
          {
            name: 'Combinado (16 peças)',
            description: 'Mix de salmão, atum e uramaki',
            price: 68.9,
          },
        ],
      },
      {
        name: 'Pratos Quentes',
        items: [
          {
            name: 'Yakissoba',
            description: 'Macarrão com legumes e carne (porção individual)',
            price: 32.9,
          },
          { name: 'Tempurá de Legumes', description: 'Mix de legumes empanados', price: 28.9 },
          { name: 'Gyoza (6 peças)', description: 'Pastel japonês de carne', price: 24.9 },
        ],
      },
      {
        name: 'Bebidas',
        items: [
          { name: 'Chá Verde Gelado', description: 'Natural (300ml)', price: 10.0 },
          {
            name: 'Refrigerante Lata',
            description: 'Coca-Cola, Guaraná ou Fanta (350ml)',
            price: 8.0,
          },
          { name: 'Água Mineral', description: 'Sem gás (500ml)', price: 5.0 },
        ],
      },
    ],
  },
  brasileira: {
    id: 'brasileira',
    label: 'Brasileira',
    categories: [
      {
        name: 'Pratos do Dia',
        items: [
          {
            name: 'PF de Frango',
            description: 'Arroz, feijão, frango grelhado, batata frita e salada',
            price: 25.9,
          },
          {
            name: 'PF de Carne',
            description: 'Arroz, feijão, bife acebolado, farofa e salada',
            price: 27.9,
          },
          {
            name: 'Feijoada',
            description: 'Feijão preto, carnes defumadas, arroz, couve e farofa (serve 2)',
            price: 49.9,
          },
          {
            name: 'Moqueca de Peixe',
            description: 'Peixe cozido no leite de coco com pimentões e dendê (serve 2)',
            price: 55.9,
          },
          {
            name: 'Strogonoff de Frango',
            description: 'Arroz, batata palha e strogonoff cremoso',
            price: 29.9,
          },
        ],
      },
      {
        name: 'Petiscos',
        items: [
          {
            name: 'Pastel de Carne',
            description: 'Pastel frito na hora (2 unidades)',
            price: 14.9,
          },
          {
            name: 'Coxinha',
            description: 'Coxinha de frango com catupiry (2 unidades)',
            price: 12.9,
          },
          { name: 'Bolinho de Bacalhau', description: 'Porção de 6 unidades', price: 26.9 },
        ],
      },
      {
        name: 'Bebidas',
        items: [
          {
            name: 'Refrigerante Lata',
            description: 'Coca-Cola, Guaraná ou Fanta (350ml)',
            price: 8.0,
          },
          { name: 'Água Mineral', description: 'Sem gás (500ml)', price: 5.0 },
          { name: 'Suco Natural', description: 'Laranja, limão ou maracujá (300ml)', price: 12.0 },
        ],
      },
    ],
  },
  acai: {
    id: 'acai',
    label: 'Açaí',
    categories: [
      {
        name: 'Açaí',
        items: [
          {
            name: 'Açaí Tradicional (300ml)',
            description: 'Açaí batido com banana e granola',
            price: 19.9,
          },
          {
            name: 'Açaí Proteico (400ml)',
            description: 'Açaí com whey, banana, granola e pasta de amendoim',
            price: 26.9,
          },
          {
            name: 'Açaí Bowl (500ml)',
            description: 'Açaí com morango, banana, kiwi, granola e mel',
            price: 32.9,
          },
        ],
      },
      {
        name: 'Adicionais',
        items: [
          { name: 'Granola Extra', description: 'Porção adicional', price: 4.0 },
          { name: 'Pasta de Amendoim', description: 'Colher extra', price: 5.0 },
          { name: 'Frutas Extras', description: 'Banana, morango ou kiwi', price: 6.0 },
        ],
      },
      {
        name: 'Bebidas',
        items: [
          { name: 'Água de Coco', description: 'Natural (300ml)', price: 8.0 },
          { name: 'Suco Natural', description: 'Laranja, limão ou maracujá (300ml)', price: 12.0 },
          { name: 'Água Mineral', description: 'Sem gás (500ml)', price: 5.0 },
        ],
      },
    ],
  },
  sobremesas: {
    id: 'sobremesas',
    label: 'Sobremesas',
    categories: [
      {
        name: 'Bolos',
        items: [
          {
            name: 'Bolo de Chocolate',
            description: 'Fatia generosa com calda de chocolate',
            price: 16.9,
          },
          {
            name: 'Bolo de Cenoura',
            description: 'Fatia com cobertura de chocolate',
            price: 14.9,
          },
          { name: 'Cheesecake', description: 'Cheesecake de frutas vermelhas', price: 19.9 },
        ],
      },
      {
        name: 'Doces',
        items: [
          { name: 'Brigadeiro Gourmet', description: 'Caixa com 6 unidades', price: 22.9 },
          {
            name: 'Pudim de Leite',
            description: 'Pudim caseiro com calda de caramelo',
            price: 14.9,
          },
          {
            name: 'Petit Gâteau',
            description: 'Bolo de chocolate com sorvete de baunilha',
            price: 24.9,
          },
        ],
      },
      {
        name: 'Bebidas',
        items: [
          { name: 'Café Expresso', description: 'Curto e intenso', price: 6.0 },
          { name: 'Cappuccino', description: 'Com leite vaporizado e canela', price: 10.0 },
          { name: 'Chocolate Quente', description: 'Com chantilly', price: 14.9 },
        ],
      },
    ],
  },
  cafeteria: {
    id: 'cafeteria',
    label: 'Cafeteria',
    categories: [
      {
        name: 'Cafés',
        items: [
          { name: 'Expresso', description: 'Curto e intenso', price: 6.0 },
          { name: 'Cappuccino', description: 'Com leite vaporizado e canela', price: 10.0 },
          { name: 'Latte', description: 'Café com bastante leite vaporizado', price: 12.0 },
          { name: 'Mocha', description: 'Café com chocolate e leite vaporizado', price: 14.9 },
          { name: 'Cold Brew', description: 'Café extraído a frio por 12h', price: 13.9 },
        ],
      },
      {
        name: 'Salgados',
        items: [
          { name: 'Pão de Queijo', description: 'Porção de 6 unidades', price: 14.9 },
          { name: 'Croissant', description: 'Manteiga ou chocolate', price: 12.9 },
          { name: 'Torta de Frango', description: 'Fatia de torta salgada do dia', price: 16.9 },
        ],
      },
      {
        name: 'Doces',
        items: [
          { name: 'Brownie', description: 'Com nozes e cobertura de chocolate', price: 13.9 },
          { name: 'Cookie', description: 'Cookie americano com gotas de chocolate', price: 9.9 },
        ],
      },
    ],
  },
};

export function getTemplate(id: string): MenuTemplate | null {
  return MENU_TEMPLATES[id] ?? null;
}

export function getAllTemplates(): { id: string; label: string }[] {
  return Object.values(MENU_TEMPLATES).map(({ id, label }) => ({ id, label }));
}
