import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ─── Intégration native (Capacitor) ──────────────────────────────
// Ce bloc ne s'exécute que dans l'app iOS/Android empaquetée.
// Sur le web classique, Capacitor.isNativePlatform() = false → ignoré.
async function initNative() {
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (!Capacitor?.isNativePlatform?.()) return

    // Dans l'app native, on désactive le service worker (cache PWA) :
    // c'est une cause fréquente d'écran blanc (une version vide périmée est
    // servie depuis le cache). L'app native embarque déjà tout son code.
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(regs.map(r => r.unregister()))
      }
    } catch {}

    // Barre de statut : texte clair sur fond sombre Yatsai
    try {
      const { StatusBar, Style } = await import('@capacitor/status-bar')
      await StatusBar.setStyle({ style: Style.Dark }) // Dark = contenu clair
      if (Capacitor.getPlatform() === 'android') {
        await StatusBar.setBackgroundColor({ color: '#080F20' })
      }
    } catch {}

    // Masque le splash une fois l'app prête
    try {
      const { SplashScreen } = await import('@capacitor/splash-screen')
      await SplashScreen.hide()
    } catch {}
  } catch {
    // @capacitor/core absent en pur web : on ignore silencieusement
  }
}
initNative()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
