// src/components/home/Categories.tsx
import { CATEGORIES } from '@/lib/constants/restaurant.constants';

export default function Categories() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-6">
      <h2 className="text-xl font-bold mb-4">Categorias</h2>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            className="flex flex-col items-center gap-2 min-w-[80px] p-4 bg-gray-100 rounded-2xl hover:bg-[#E6F7F4] hover:ring-2 hover:ring-[#00A082] transition-all"
          >
            <span className="text-3xl">{category.icon}</span>
            <span className="text-sm font-medium whitespace-nowrap">{category.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
