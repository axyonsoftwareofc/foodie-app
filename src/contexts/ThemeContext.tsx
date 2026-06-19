// src/contexts/ThemeContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'foodie-theme';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [isHydrated, setIsHydrated] = useState(false);

  // Hidratar do localStorage e preferência do sistema
  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;

      if (stored) {
        setThemeState(stored);
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setThemeState(prefersDark ? 'dark' : 'light');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
    setIsHydrated(true);
  }, []);

  // Aplicar tema no documento
  useEffect(() => {
    if (isHydrated) {
      const root = document.documentElement;

      root.classList.remove('light', 'dark');
      root.classList.add(theme);

      // Também aplicar no body como fallback
      document.body.classList.remove('light', 'dark');
      document.body.classList.add(theme);

      // Atualizar data attribute (alternativa)
      root.setAttribute('data-theme', theme);

      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [theme, isHydrated]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
