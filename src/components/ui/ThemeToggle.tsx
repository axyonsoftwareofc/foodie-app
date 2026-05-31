// src/components/ui/ThemeToggle.tsx
'use client';

import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className={`relative p-3 rounded-full transition-colors ${className}`}
      style={{ backgroundColor: 'var(--color-bg-secondary)' }}
      aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
    >
      <motion.div
        initial={false}
        animate={{
          rotate: theme === 'dark' ? 180 : 0,
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 0.3 }}
      >
        {theme === 'dark' ? (
          <Moon size={20} className="text-yellow-400" />
        ) : (
          <Sun size={20} className="text-orange-500" />
        )}
      </motion.div>
    </motion.button>
  );
}
