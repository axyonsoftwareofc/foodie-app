'use client';

import type { OrderStats } from '@/actions/orders';

function getLast7Days() {
  const days: { label: string; date: Date; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push({
      label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      date: d,
      count: 0,
    });
  }
  return days;
}

export function RevenueChart({ stats }: { stats: OrderStats | null }) {
  const days = getLast7Days();

  if (stats) {
    days[days.length - 1].count = stats.totalToday;
  }

  const maxCount = Math.max(...days.map((d) => d.count), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900 mb-4">Pedidos — Ultimos 7 dias</h3>
      <div className="flex items-end gap-2 h-40">
        {days.map((day) => (
          <div key={day.label} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs font-bold text-gray-700">{day.count}</span>
            <div
              className="w-full rounded-t-md transition-all duration-500"
              style={{
                height: `${(day.count / maxCount) * 100}%`,
                minHeight: day.count > 0 ? '8px' : '0',
                backgroundColor: day.label === days[days.length - 1].label ? '#00A082' : '#D1FAE5',
              }}
            />
            <span className="text-[10px] text-gray-400">{day.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
