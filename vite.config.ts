import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/ai-kkodle/',
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
});
