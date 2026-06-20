// src/app/mesa/[tableId]/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Plus, Minus, Send, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string | null;
  categoryName: string;
}

interface TableInfo {
  number: string;
  restaurantName: string;
  restaurantId: string;
}

interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export default function MesaPage() {
  const { tableId } = useParams<{ tableId: string }>();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [table, setTable] = useState<TableInfo | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/mesa/${tableId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setTable(data.table);
          setMenu(data.menu);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Erro ao carregar o cardapio');
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

  async function handleSend() {
    if (cart.length === 0 || !table) return;
    setSending(true);
    const res = await fetch(`/api/mesa/${tableId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart }),
    });
    setSending(false);
    if (res.ok) {
      setSent(true);
      toast.success('Pedido enviado para a cozinha!');
    } else {
      toast.error('Erro ao enviar pedido');
    }
  }

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <p className="text-gray-500">Carregando cardapio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <UtensilsCrossed className="w-16 h-16 text-gray-300" />
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          Mesa indisponivel
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {error}
        </p>
      </div>
    );
  }

  if (sent) {
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
          Mesa {table?.number} — {table?.restaurantName}
        </p>
        <button
          onClick={() => {
            setCart([]);
            setSent(false);
          }}
          className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white"
        >
          Fazer outro pedido
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="border-b p-3 text-center" style={{ borderColor: 'var(--color-border)' }}>
        <h1 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
          {table?.restaurantName}
        </h1>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Mesa {table?.number} · {cart.length} itens · R$ {cartTotal.toFixed(2).replace('.', ',')}
        </p>
      </div>

      <div className="flex-1 overflow-auto p-3">
        {categories.map(([categoryName, items]) => (
          <div key={categoryName} className="mb-4">
            <h2
              className="mb-2 text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {categoryName}
            </h2>
            <div className="space-y-1.5">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="flex w-full items-center gap-3 rounded-xl border p-2.5 text-left hover:bg-gray-50 active:scale-[0.98] transition-all"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-bg-card)',
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
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

      {cart.length > 0 && (
        <div className="border-t p-3 space-y-2" style={{ borderColor: 'var(--color-border)' }}>
          {cart.map((item) => (
            <div
              key={item.productId}
              className="flex items-center gap-2 text-sm"
              style={{ color: 'var(--color-text)' }}
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
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
              </span>
            </div>
          ))}
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {sending
              ? 'Enviando...'
              : `Enviar pedido · R$ ${cartTotal.toFixed(2).replace('.', ',')}`}
          </button>
        </div>
      )}
    </div>
  );
}
