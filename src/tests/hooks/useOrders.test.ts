import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOrders } from '../../hooks/useOrders';
import { getOrders, type OrderData } from '@/actions/orders';

vi.mock('@/actions/orders', () => ({
  getOrders: vi.fn(),
}));

const ORDERS_STORAGE_KEY = 'foodie-orders';

const mockOrder: OrderData = {
  id: 'ABC123',
  userId: 'user-1',
  customerName: 'Cliente Teste',
  customerPhone: null,
  items: [],
  address: {
    street: 'Rua Teste',
    number: '123',
    complement: '',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01234-567',
  },
  paymentMethod: 'PIX',
  changeFor: null,
  subtotal: 59.8,
  deliveryFee: 5.99,
  discount: 0,
  total: 65.79,
  restaurantId: '1',
  restaurantName: 'Test Restaurant',
  orderType: 'DELIVERY',
  tableNumber: null,
  status: 'PENDING',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  couponCode: null,
  estimatedDelivery: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
  estimatedPreparationTime: 45,
  preparationStartedAt: null,
  readyAt: null,
  deliveredAt: null,
  cancelledAt: null,
  cancelReason: null,
};

describe('useOrders', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.mocked(getOrders).mockResolvedValue({ error: 'Usuário não autenticado' });
  });

  it('should start with empty orders', async () => {
    const { result } = renderHook(() => useOrders());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.orders).toEqual([]);
  });

  it('should load orders from localStorage', async () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify([mockOrder]));

    const { result } = renderHook(() => useOrders());

    await waitFor(() => expect(result.current.orders).toHaveLength(1));
    expect(result.current.orders[0].id).toBe('ABC123');
  });

  it('should handle empty localStorage', async () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const { result } = renderHook(() => useOrders());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.orders).toEqual([]);
  });

  it('should handle invalid JSON in localStorage', async () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('invalid-json');

    const { result } = renderHook(() => useOrders());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.orders).toEqual([]);
  });

  it('should add order to beginning of list', async () => {
    const { result } = renderHook(() => useOrders());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => {
      result.current.addOrder(mockOrder);
    });

    expect(result.current.orders).toHaveLength(1);
    expect(result.current.orders[0].id).toBe('ABC123');
  });

  it('should add multiple orders', async () => {
    const { result } = renderHook(() => useOrders());

    const order1 = { ...mockOrder, id: 'order-1' };
    const order2 = { ...mockOrder, id: 'order-2' };

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => {
      result.current.addOrder(order1);
      result.current.addOrder(order2);
    });

    expect(result.current.orders).toHaveLength(2);
    expect(result.current.orders[0].id).toBe('order-2');
    expect(result.current.orders[1].id).toBe('order-1');
  });

  it('should get order by id', async () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify([mockOrder]));

    const { result } = renderHook(() => useOrders());

    await waitFor(() => expect(result.current.orders).toHaveLength(1));
    const found = result.current.getOrderById('ABC123');
    expect(found).toBeDefined();
    expect(found?.id).toBe('ABC123');
  });

  it('should return undefined for non-existent order', async () => {
    const { result } = renderHook(() => useOrders());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => {
      result.current.addOrder(mockOrder);
    });

    const found = result.current.getOrderById('NON-EXISTENT');
    expect(found).toBeUndefined();
  });

  it('should update order status', async () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify([mockOrder]));

    const { result } = renderHook(() => useOrders());

    await waitFor(() => expect(result.current.orders).toHaveLength(1));
    act(() => {
      result.current.updateOrderStatus('ABC123', 'CONFIRMED');
    });

    expect(result.current.orders[0].status).toBe('CONFIRMED');
  });

  it('should update only specific order status', async () => {
    const order1 = { ...mockOrder, id: 'order-1' };
    const order2 = { ...mockOrder, id: 'order-2' };

    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
      JSON.stringify([order1, order2])
    );

    const { result } = renderHook(() => useOrders());

    await waitFor(() => expect(result.current.orders).toHaveLength(2));
    act(() => {
      result.current.updateOrderStatus('order-1', 'CONFIRMED');
    });

    expect(result.current.orders[0].status).toBe('CONFIRMED');
    expect(result.current.orders[1].status).toBe('PENDING');
  });

  it('should persist orders to localStorage', async () => {
    const { result } = renderHook(() => useOrders());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => {
      result.current.addOrder(mockOrder);
    });

    expect(localStorage.setItem).toHaveBeenCalledWith(ORDERS_STORAGE_KEY, expect.any(String));
  });
});
