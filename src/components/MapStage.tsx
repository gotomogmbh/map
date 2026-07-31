import { useEffect, useRef } from 'react'
import { AttributionControl, Map as MapLibreMap } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { buildStyle } from '../map/buildStyle'
import { themeById } from '../map/themes'
import type { ViewState } from '../types'

type Props = {
  view: ViewState
  /** Kamerabewegungen des Nutzers zurück in den State melden */
  onViewChange: (v: Partial<ViewState>) => void
}

export function MapStage({ view, onViewChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  // Verhindert, dass programmatische Kameraupdates als Nutzerinteraktion zurückfliessen
  const syncingRef = useRef(false)
  const styleInitRef = useRef(true)

  // Karte einmalig aufbauen
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new MapLibreMap({
      container: containerRef.current,
      style: buildStyle(themeById(view.themeId), {
        heightFactor: view.heightFactor,
        buildingOpacity: view.buildingOpacity,
        showLabels: view.showLabels,
        shadowOn: view.shadowOn,
        shadowAngle: view.shadowAngle,
        shadowLength: view.shadowLength,
        shadowOpacity: view.shadowOpacity,
        cornerRadius: view.cornerRadius,
        showTunnels: view.showTunnels,
      }),
      center: view.center,
      zoom: view.zoom,
      pitch: view.pitch,
      bearing: view.bearing,
      maxPitch: 85,
      attributionControl: false,
      dragRotate: true,
    })

    map.addControl(
      new AttributionControl({
        compact: true,
        customAttribution: '© OpenStreetMap-Mitwirkende · OpenFreeMap',
      }),
      'bottom-right',
    )

    const report = () => {
      if (syncingRef.current) return
      const c = map.getCenter()
      onViewChange({
        center: [Number(c.lng.toFixed(6)), Number(c.lat.toFixed(6))],
        zoom: Number(map.getZoom().toFixed(2)),
        pitch: Number(map.getPitch().toFixed(1)),
        bearing: Number(map.getBearing().toFixed(1)),
      })
    }
    map.on('moveend', report)
    map.on('rotateend', report)
    map.on('pitchend', report)

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Style neu aufbauen, wenn sich Theme oder Style-Optionen ändern.
  // Beim ersten Durchlauf nicht — die Karte wurde bereits damit erzeugt.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (styleInitRef.current) {
      styleInitRef.current = false
      return
    }
    map.setStyle(
      buildStyle(themeById(view.themeId), {
        heightFactor: view.heightFactor,
        buildingOpacity: view.buildingOpacity,
        showLabels: view.showLabels,
        shadowOn: view.shadowOn,
        shadowAngle: view.shadowAngle,
        shadowLength: view.shadowLength,
        shadowOpacity: view.shadowOpacity,
        cornerRadius: view.cornerRadius,
        showTunnels: view.showTunnels,
      }),
    )
  }, [
    view.themeId,
    view.heightFactor,
    view.buildingOpacity,
    view.showLabels,
    view.shadowOn,
    view.shadowAngle,
    view.shadowLength,
    view.shadowOpacity,
    view.cornerRadius,
    view.showTunnels,
  ])

  // Kamera folgt dem State (z. B. bei Haltestellenwechsel oder Slider-Eingabe)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const same =
      Math.abs(map.getCenter().lng - view.center[0]) < 1e-6 &&
      Math.abs(map.getCenter().lat - view.center[1]) < 1e-6 &&
      Math.abs(map.getZoom() - view.zoom) < 0.01 &&
      Math.abs(map.getPitch() - view.pitch) < 0.1 &&
      Math.abs(map.getBearing() - view.bearing) < 0.1
    if (same) return

    syncingRef.current = true
    map.jumpTo({
      center: view.center,
      zoom: view.zoom,
      pitch: view.pitch,
      bearing: view.bearing,
    })
    // nach dem Frame wieder freigeben
    requestAnimationFrame(() => {
      syncingRef.current = false
    })
  }, [view.center, view.zoom, view.pitch, view.bearing])

  return <div ref={containerRef} className="map-canvas" />
}
