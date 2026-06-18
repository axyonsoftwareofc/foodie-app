// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.tsx'],
    include: ['src/tests/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['src/tests/e2e/**/*', 'node_modules'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/tests/', '**/*.d.ts', '**/*.config.*', 'src/app/layout.tsx'],
      thresholds: {
        lines: 63,
        functions: 73,
        branches: 51,
        statements: 63,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
