export type ViewState = {
  stopId: string
  center: [number, number]
  zoom: number
  /** Neigung in Grad — 0 = Draufsicht, ~45 = deutlich abgekippt */
  pitch: number
  /** Drehung in Grad — 0 = Norden oben */
  bearing: number
  themeId: string
  heightFactor: number
  buildingOpacity: number
  showLabels: boolean
  shadowOn: boolean
  /** Sonnenrichtung in Grad */
  shadowAngle: number
  /** Schattenlänge in Pixeln */
  shadowLength: number
  shadowOpacity: number
  /** Eckenrundung des Schattens in Pixeln */
  cornerRadius: number
  /** Unterirdische Bahnstrecken gestrichelt einblenden */
  showTunnels: boolean
}

/** Startzustand: bewusst am Tesla-Vorbild ausgerichtet — flache Kamera,
 *  monochrom, keine Beschriftung, Lesbarkeit über den Schlagschatten. */
export const DEFAULT_VIEW: ViewState = {
  stopId: 'bellevue',
  center: [8.5448, 47.3668],
  zoom: 17.2,
  pitch: 22,
  bearing: -20,
  themeId: 'mono',
  heightFactor: 1,
  buildingOpacity: 1,
  showLabels: false,
  shadowOn: true,
  shadowAngle: 135,
  shadowLength: 8,
  shadowOpacity: 0.3,
  cornerRadius: 2,
  showTunnels: false,
}
