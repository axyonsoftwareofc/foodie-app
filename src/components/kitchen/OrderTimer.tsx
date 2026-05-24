// src/components/kitchen/OrderTimer.tsx
'use client';

import { useState, useEffect } from 'react'
import { AlertTriangle, Clock } from 'lucide-react'
import { useKitchenTimer } from '@/contexts/KitchenTimerContext'

export interface OrderTimerProps {
  startTime: string;
  showAlert?: boolean;
  onTimeout?: () => void;
}

export function OrderTimer({ startTime, showAlert = true }: OrderTimerProps) {
  const tick = useKitchenTimer()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    setNow(Date.now())
  }, [tick])

  const elapsedSeconds = (() => {
    const start = new Date(startTime).getTime()
    const diffMs = now - start
    return Math.floor(diffMs / 1000)
  })()

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    }

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);

  const getTimerColor = () => {
    if (elapsedMinutes >= 30) return 'text-red-600';
    if (elapsedMinutes >= 20) return 'text-amber-600';
    if (elapsedMinutes >= 10) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getTimerBgColor = () => {
    if (elapsedMinutes >= 30) return 'bg-red-100 border-red-300';
    if (elapsedMinutes >= 20) return 'bg-amber-100 border-amber-300';
    if (elapsedMinutes >= 10) return 'bg-yellow-100 border-yellow-300';
    return 'bg-gray-100 border-gray-200';
  };

  const getAlertLevel = () => {
    if (elapsedMinutes >= 30) return 'critical';
    if (elapsedMinutes >= 20) return 'warning';
    if (elapsedMinutes >= 10) return 'attention';
    return null;
  };

  const alertLevel = getAlertLevel();

  return (
      <div className="flex items-center gap-2">
        <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-semibold ${getTimerBgColor()}`}
        >
          {alertLevel === 'critical' ? (
              <AlertTriangle className="w-3.5 h-3.5 text-red-600 animate-pulse" />
          ) : (
              <Clock className={`w-3.5 h-3.5 ${getTimerColor()}`} />
          )}
          <span className={getTimerColor()}>
          {formatTime(elapsedSeconds)}
        </span>
        </div>

        {showAlert && alertLevel === 'critical' && (
            <span className="text-xs font-bold text-red-600 animate-pulse">
          ATRASADO!
        </span>
        )}

        {showAlert && alertLevel === 'warning' && (
            <span className="text-xs font-medium text-amber-600">
          Atenção
        </span>
        )}
      </div>
  );
}