'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Store, MapPin, Palette, ChevronRight } from 'lucide-react';

const STEPS = [
  { path: '/onboarding', label: 'Dados', icon: Store },
  { path: '/onboarding/domain', label: 'Endereco', icon: MapPin },
  { path: '/onboarding/theme', label: 'Aparencia', icon: Palette },
];

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentIndex = STEPS.findIndex((s) => s.path === pathname);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-emerald-700 font-bold text-lg">
            <Store className="w-6 h-6" />
            Foodie
          </Link>
          <span className="text-sm text-gray-500">
            Passo {currentIndex + 1} de {STEPS.length}
          </span>
        </div>

        <div className="max-w-2xl mx-auto px-4 pb-4">
          <div className="flex items-center gap-1">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isCurrent = i === currentIndex;
              const isDone = i < currentIndex;

              return (
                <div key={step.path} className="flex items-center gap-1 flex-1 last:flex-none">
                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isCurrent
                        ? 'bg-emerald-100 text-emerald-700'
                        : isDone
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{step.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">{children}</main>

      <footer className="py-4 text-center text-xs text-gray-400">
        Foodie App — Criar meu restaurante
      </footer>
    </div>
  );
}
