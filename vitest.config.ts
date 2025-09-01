import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [
      ...configDefaults.exclude,
      // Run UI tests with their own jsdom config via `npm run ui:test`
      'apps/traide-ui/test/**/*.*',
      'node_modules/@traide/ui/**/*.*',
    ],
    server: { deps: { external: ['ws'] } },
    deps: { optimizer: { ssr: { exclude: ['ws'] } } },
    globals: false,
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      reporter: ['text', 'html', 'lcov'],
      all: true,
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts'],
      thresholds: {
        statements: 95,
        branches: 88,
        functions: 95,
        lines: 95,
      },
    },
  },
});
