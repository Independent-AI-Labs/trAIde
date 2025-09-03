import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
  coverage: {
    provider: 'v8',
    reportsDirectory: 'coverage',
    reporter: ['text', 'html', 'lcov'],
    all: true,
    include: ['src/**/*.{ts,tsx}'],
    thresholds: {
      statements: 70,
      lines: 70,
      branches: 60,
      functions: 65,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  esbuild: {
    jsx: 'automatic',
    jsxDev: true,
  },
})
