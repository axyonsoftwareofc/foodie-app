// src/hooks/useGeolocation.ts
'use client';

import { useState, useCallback } from 'react';

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    loading: false,
    error: null,
  });

  const getCurrentPosition = useCallback((): Promise<GeolocationState> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        const error = 'Geolocalização não suportada pelo navegador';
        setState((prev) => ({ ...prev, loading: false, error }));
        resolve({ ...state, loading: false, error });
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newState = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            loading: false,
            error: null,
          };
          setState(newState);
          resolve(newState);
        },
        (error) => {
          let errorMessage = 'Erro ao obter localização';

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permissão de localização negada';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Localização indisponível';
              break;
            case error.TIMEOUT:
              errorMessage = 'Tempo esgotado ao obter localização';
              break;
          }

          const newState = {
            latitude: null,
            longitude: null,
            loading: false,
            error: errorMessage,
          };
          setState(newState);
          resolve(newState);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // 5 minutos
        }
      );
    });
  }, [state]);

  return {
    ...state,
    getCurrentPosition,
  };
}
