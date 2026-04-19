import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy les fonctions Netlify vers le serveur local de fonctions (port 9999).
    // En dev : lancer `npm run dev:functions` dans un terminal séparé.
    // En prod : Netlify sert /.netlify/functions/* nativement, ce proxy n'est pas actif.
    proxy: {
      '/.netlify/functions': {
        target: 'http://localhost:9999',
        changeOrigin: true,
      },
    },
  },
  // Vitest — setup de test ciblé sans changer le runtime app
  test: {
    environment: 'node',
    globals: true,
  },
})
