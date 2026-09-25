import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    // globals: true deja disponibles describe/it/expect y permite que
    // @testing-library/jest-dom extienda el expect de Vitest.
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    css: false,
  },
})
