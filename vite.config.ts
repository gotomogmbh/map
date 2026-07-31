import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const require = createRequire(import.meta.url)

/**
 * maplibre-gl lädt seinen Worker zur Laufzeit über eine relative URL neben
 * dem eigenen Bundle (`./maplibre-gl-worker.mjs`). Vite bündelt diese Datei
 * nicht mit, weil sie nirgends importiert wird — im Produktionsbuild lief
 * die Anfrage deshalb ins Leere und die Karte startete nicht.
 *
 * Also beide Worker-Dateien unverändert in dasselbe Ausgabeverzeichnis
 * legen wie das Hauptbundle. Der Worker importiert seinerseits die
 * shared-Datei relativ, sie muss also danebenliegen.
 */
function maplibreWorkerAssets(): Plugin {
  const WORKER_FILES = ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']

  return {
    name: 'maplibre-worker-assets',
    apply: 'build',
    generateBundle(options) {
      const distDir = dirname(require.resolve('maplibre-gl/dist/maplibre-gl-worker.mjs'))
      const assetsDir = options.assetFileNames?.toString().split('/')[0] ?? 'assets'

      for (const file of WORKER_FILES) {
        this.emitFile({
          type: 'asset',
          fileName: `${assetsDir}/${file}`,
          source: readFileSync(join(distDir, file)),
        })
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), maplibreWorkerAssets()],
  // Im Dev-Server umgekehrt: ungebündelt ausliefern, sonst findet der
  // Dep-Optimizer den Worker in seinem Cache nicht.
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },
})
