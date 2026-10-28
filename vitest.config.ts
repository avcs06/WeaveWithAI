import { defineConfig } from 'vitest/config';

// Only the generator's own tests: template/ and mcps/ run theirs with their own tooling.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});
