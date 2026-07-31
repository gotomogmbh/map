import { useCallback, useEffect, useRef, useState } from 'react'
import { MapStage } from './components/MapStage'
import { ControlPanel } from './components/ControlPanel'
import { DEFAULT_VIEW } from './types'
import type { ViewState } from './types'

/** Zielformat des Kiosk-Screens */
const SCREEN_W = 1920
const SCREEN_H = 1920
// Version im Schlüssel: bei neuen Feldern hochzählen, dann startet die
// Vorschau wieder auf DEFAULT_VIEW statt auf einem veralteten Zustand.
const STORAGE_KEY = 'zvv-map-view-v2'

function loadView(): ViewState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_VIEW, ...JSON.parse(raw) }
  } catch {
    /* ignorieren — dann eben Defaults */
  }
  return DEFAULT_VIEW
}

export default function App() {
  const [view, setView] = useState<ViewState>(loadView)
  const [scale, setScale] = useState(1)
  const [panelOpen, setPanelOpen] = useState(true)
  const frameRef = useRef<HTMLDivElement>(null)

  const update = useCallback((patch: Partial<ViewState>) => {
    setView((prev) => ({ ...prev, ...patch }))
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(view))
  }, [view])

  // Screen 1080×1920 immer vollständig in den verfügbaren Platz einpassen
  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const fit = () => {
      const { width, height } = el.getBoundingClientRect()
      setScale(Math.min(width / SCREEN_W, (height - 40) / SCREEN_H))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // "P" blendet das Panel aus — für den Blick auf die reine Karte
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target?.tagName === 'INPUT' || target?.tagName === 'SELECT') return
      if (e.key.toLowerCase() === 'p' && !e.metaKey && !e.ctrlKey) setPanelOpen((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className={`app ${panelOpen ? '' : 'panel-hidden'}`}>
      <div className="stage-area" ref={frameRef}>
        <div
          className="screen"
          style={{
            width: SCREEN_W,
            height: SCREEN_H,
            transform: `translate(-50%, -50%) scale(${scale})`,
          }}
        >
          <MapStage view={view} onViewChange={update} />
        </div>
        <div className="stage-caption">
          {SCREEN_W} × {SCREEN_H} · {Math.round(scale * 100)} % Vorschau · <kbd>P</kbd> blendet das
          Panel aus
        </div>
      </div>

      {panelOpen && <ControlPanel view={view} onChange={update} />}
    </div>
  )
}
