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
      include: ['src/**/*.ts', 'packages/traide-mcp/src/**/*.ts'],
      exclude: ['src/index.ts'],
      thresholds: {
        statements: 85,
        branches: 78,
        functions: 93,
        lines: 85,
      },
    },
  },
});
