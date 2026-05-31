// src/components/cart/CartEmpty.tsx
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

export default function CartEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
      >
        <ShoppingBag size={40} style={{ color: 'var(--color-text-secondary)' }} />
      </div>

      <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
        Seu carrinho está vazio
      </h2>

      <p className="text-center mb-8 max-w-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Adicione itens de um restaurante para começar seu pedido
      </p>

      <Link
        href="/"
        className="bg-[#00A082] text-white px-8 py-4 rounded-full font-semibold hover:bg-[#008F74] transition-colors"
      >
        Explorar restaurantes
      </Link>
    </div>
  );
}
