'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

const KitchenTimerContext = createContext<number>(0);

export function KitchenTimerProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  return <KitchenTimerContext.Provider value={tick}>{children}</KitchenTimerContext.Provider>;
}

export function useKitchenTimer(): number {
  return useContext(KitchenTimerContext);
}
