import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  // --- CODEX CHANGE START ---
  // Codex modification - enable a lightweight Vitest setup for targeted
  // stabilization tests without changing the app runtime.
  test: {
    environment: 'node',
    globals: true,
  }
  // --- CODEX CHANGE END ---
})
