import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { logger } from './services/logger'

// Error monitoring: capture unhandled errors and log structurally
window.addEventListener('error', (e) => {
  logger.error('window:error', { message: e.message, filename: e.filename, lineno: e.lineno })
})
window.addEventListener('unhandledrejection', (e) => {
  logger.error('window:unhandledrejection', { reason: String(e.reason) })
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
