// src/components/home/PromoBanner.tsx
export default function PromoBanner() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#00A082] to-[#007D66] text-white">
        <div className="relative z-10 p-8 md:p-12">
          <span className="inline-block bg-white/20 px-3 py-1 rounded-full text-sm font-medium mb-4">
            🔥 Oferta Especial
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-2">50% OFF no primeiro pedido!</h2>
          <p className="text-white/80 mb-6 max-w-md">
            Use o cupom PRIMEIRA e aproveite desconto em milhares de restaurantes.
          </p>
          <button className="bg-white text-[#00A082] px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors">
            Pedir agora
          </button>
        </div>

        {/* Decoração */}
        <div className="absolute right-0 top-0 w-1/3 h-full opacity-10">
          <div className="absolute right-10 top-10 text-[150px]">🍔</div>
        </div>
      </div>
    </section>
  );
}
