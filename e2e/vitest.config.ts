import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['helpers/**/*.spec.ts', 'pages/**/*.spec.ts'],
    exclude: ['tests/**'],
  },
});
