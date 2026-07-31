import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // maplibre-gl lädt seinen Worker als separates Modul — der Dep-Optimizer
  // findet ihn im Cache nicht, deshalb ungebündelt ausliefern.
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },
})
