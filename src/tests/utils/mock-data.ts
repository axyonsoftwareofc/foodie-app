// src/tests/utils/mock-data.ts
import { Restaurant, MenuItem, CartItem, OrderData } from '../../types';

export const mockRestaurant: Restaurant = {
  id: '1',
  name: 'Test Restaurant',
  image: 'https://example.com/image.jpg',
  rating: 4.5,
  reviewCount: 100,
  deliveryTime: '30-45 min',
  deliveryFee: 5.99,
  category: 'Pizza',
  promoted: false,
  isOpen: true,
};

export const mockMenuItem: MenuItem = {
  id: '101',
  restaurantId: '1',
  name: 'Test Pizza',
  description: 'Delicious test pizza',
  price: 29.9,
  image: 'https://example.com/pizza.jpg',
  category: 'Pizzas',
  popular: true,
  available: true,
};

export const mockCartItem: CartItem = {
  menuItem: mockMenuItem,
  quantity: 2,
  observation: 'Sem cebola',
};

export const mockOrder: OrderData = {
  id: 'ABC123',
  items: [mockCartItem],
  address: {
    id: '1',
    street: 'Rua Teste',
    number: '123',
    complement: 'Apto 1',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01234-567',
  },
  paymentMethod: 'PIX',
  subtotal: 59.8,
  deliveryFee: 5.99,
  discount: 0,
  total: 65.79,
  restaurantId: '1',
  restaurantName: 'Test Restaurant',
  status: 'PENDING',
  createdAt: new Date().toISOString(),
  estimatedDelivery: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
};
