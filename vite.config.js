import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// NB : le service worker (vite-plugin-pwa) a été retiré. Dans une app native
// Capacitor il n'apporte rien et a causé des écrans blancs (un cache périmé
// servait une coquille d'app cassée). Le nettoyage de tout SW existant est fait
// au démarrage dans main.jsx.
export default defineConfig({
  server: {
    host: true,   // écoute sur toutes les interfaces (live reload réseau local)
    port: 5173,
  },
  plugins: [
    react(),
  ],
})
