import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Resolve the project's `@/*` path alias from tsconfig.json (native in Vite 7+).
    tsconfigPaths: true,
    alias: {
      // `server-only` throws when imported outside a React Server Component.
      // Unit tests import server modules directly, so stub it out.
      'server-only': resolve(__dirname, 'test/empty-stub.ts')
    }
  },
  test: {
    // Node environment — these are server/logic unit tests, no DOM needed.
    environment: 'node',
    globals: true,
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'dist'],
    coverage: {
      provider: 'v8',
      include: ['lib/**/*.ts', 'server/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.spec.ts']
    }
  }
});
