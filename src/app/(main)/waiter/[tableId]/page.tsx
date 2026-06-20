// src/app/waiter/[tableId]/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getMenu, createDineInOrder, getTables } from '@/actions/waiter-actions';
import { ArrowLeft, Plus, Minus, Send, ShoppingBag, StickyNote } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string | null;
  categoryName: string;
  image: string | null;
  isAvailable: boolean;
}

interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export default function WaiterTablePage() {
  const { tableId } = useParams<{ tableId: string }>();
  const router = useRouter();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [kitchenNotes, setKitchenNotes] = useState('');
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getMenu(), getTables()]).then(([menuResult, tablesResult]) => {
      if (menuResult.data) setMenu(menuResult.data);
      if (tablesResult.data) {
        const table = tablesResult.data.find((t) => t.id === tableId);
        if (table) setTableNumber(table.number);
      }
      setLoading(false);
    });
  }, [tableId]);

  const categories = useMemo(() => {
    const cats = new Map<string, MenuItem[]>();
    menu.forEach((item) => {
      const existing = cats.get(item.categoryName) || [];
      existing.push(item);
      cats.set(item.categoryName, existing);
    });
    return Array.from(cats.entries());
  }, [menu]);

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === item.id);
      if (existing) {
        return prev.map((c) => (c.productId === item.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { productId: item.id, name: item.name, quantity: 1, price: item.price }];
    });
  }

  function removeFromCart(productId: string) {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === productId);
      if (existing && existing.quantity === 1) {
        return prev.filter((c) => c.productId !== productId);
      }
      return prev.map((c) => (c.productId === productId ? { ...c, quantity: c.quantity - 1 } : c));
    });
  }

  function updateItemNotes(productId: string, notes: string) {
    setItemNotes((prev) => ({ ...prev, [productId]: notes }));
    setCart((prev) => prev.map((c) => (c.productId === productId ? { ...c, notes } : c)));
  }

  async function handleSend() {
    if (cart.length === 0) return;
    setSending(true);
    const result = await createDineInOrder({
      tableId,
      tableNumber,
      customerName: `Mesa ${tableNumber}`,
      items: cart,
      kitchenNotes: kitchenNotes || undefined,
    });
    setSending(false);
    if (result.success) {
      setSuccessOrderId(result.orderId || null);
    }
  }

  if (successOrderId) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="text-5xl">✅</div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          Pedido enviado!
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Mesa {tableNumber} — Pedido #{successOrderId.slice(-6)}
        </p>
        <button
          onClick={() => {
            setCart([]);
            setKitchenNotes('');
            setItemNotes({});
            setSuccessOrderId(null);
          }}
          className="mt-4 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Novo pedido (mesa {tableNumber})
        </button>
        <button
          onClick={() => router.push('/waiter')}
          className="rounded-xl px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-800"
        >
          Voltar para mesas
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Carregando cardápio...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 border-b p-3"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <button
          onClick={() => router.push('/waiter')}
          className="rounded-lg p-1.5 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            Mesa {tableNumber}
          </h1>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {cart.length} itens · R$ {cartTotal.toFixed(2).replace('.', ',')}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white">
          <ShoppingBag className="h-4 w-4" />
          {cart.reduce((s, i) => s + i.quantity, 0)}
        </div>
      </div>

      {/* Menu */}
      <div className="flex-1 overflow-auto p-3">
        {categories.map(([categoryName, items]) => (
          <div key={categoryName} className="mb-4">
            <h2
              className="mb-2 text-sm font-semibold uppercase tracking-wide"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {categoryName}
            </h2>
            <div className="space-y-1.5">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  disabled={!item.isAvailable}
                  className="flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors hover:bg-gray-50 disabled:opacity-50"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-bg-card)',
                  }}
                >
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-lg"
                    style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                  >
                    {item.image ? '🍽️' : '🍽️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: 'var(--color-text)' }}
                    >
                      {item.name}
                    </p>
                    {item.description && (
                      <p
                        className="text-xs truncate"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {item.description}
                      </p>
                    )}
                  </div>
                  <span
                    className="text-sm font-semibold flex-shrink-0"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    R$ {item.price.toFixed(2).replace('.', ',')}
                  </span>
                  <Plus
                    className="h-4 w-4 flex-shrink-0"
                    style={{ color: 'var(--color-primary)' }}
                  />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Cart + Kitchen notes + Send */}
      {cart.length > 0 && (
        <div className="border-t p-3" style={{ borderColor: 'var(--color-border)' }}>
          <div className="mb-2 flex items-center gap-2">
            <StickyNote className="h-4 w-4" style={{ color: 'var(--color-text-secondary)' }} />
            <input
              type="text"
              value={kitchenNotes}
              onChange={(e) => setKitchenNotes(e.target.value)}
              placeholder="Obs. para cozinha (ex: sem cebola no prato todo)"
              className="flex-1 rounded-lg border px-3 py-2 text-xs"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-bg-input)',
              }}
            />
          </div>

          <div className="mb-3 max-h-32 space-y-1 overflow-auto">
            {cart.map((item) => (
              <div
                key={item.productId}
                className="flex items-center gap-2 rounded-lg border px-2 py-1.5 text-sm"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-bg-card)',
                }}
              >
                <button
                  onClick={() => removeFromCart(item.productId)}
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="flex-1 truncate text-xs">
                  {item.quantity}x {item.name}
                </span>
                <input
                  type="text"
                  value={itemNotes[item.productId] || ''}
                  onChange={(e) => updateItemNotes(item.productId, e.target.value)}
                  placeholder="Obs..."
                  className="w-20 rounded border px-1.5 py-0.5 text-xs"
                  style={{ borderColor: 'var(--color-border)' }}
                />
                <span
                  className="text-xs font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={handleSend}
            disabled={sending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {sending
              ? 'Enviando...'
              : `Enviar para cozinha · R$ ${cartTotal.toFixed(2).replace('.', ',')}`}
          </button>
        </div>
      )}
    </div>
  );
}
