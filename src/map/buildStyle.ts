import type { ExpressionSpecification, StyleSpecification } from 'maplibre-gl'
import type { Theme } from './themes'

/**
 * Vektor-Tiles: OpenFreeMap (OpenStreetMap-Daten, OpenMapTiles-Schema).
 * Kostenlos, ohne API-Key. Später gegen MapTiler oder self-hosted PMTiles
 * austauschbar — nur diese drei URLs müssen dann angepasst werden.
 */
const TILES_URL = 'https://tiles.openfreemap.org/planet'
const GLYPHS_URL = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf'

export type StyleOptions = {
  /** Multiplikator auf die reale Gebäudehöhe — >1 überhöht für mehr 3D-Wirkung */
  heightFactor: number
  /** Deckkraft der 3D-Gebäude */
  buildingOpacity: number
  /** Strassennamen und Ortslabels einblenden */
  showLabels: boolean
  /** Schlagschatten unter den Gebäuden */
  shadowOn: boolean
  /** Sonnenrichtung in Grad, 0 = Schatten nach unten/Süden */
  shadowAngle: number
  /** Schattenlänge in Bildschirmpixeln (bei mittlerer Bauhöhe) */
  shadowLength: number
  shadowOpacity: number
  /** Eckenrundung des Schattens in Pixeln */
  cornerRadius: number
  /** Unterirdische Bahnstrecken gestrichelt einblenden */
  showTunnels: boolean
}

/** Zwei Hex-Farben mischen — für deckende Schatten ohne Alpha-Überlagerung */
function mix(hexA: string, hexB: string, amount: number): string {
  const parse = (h: string) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ]
  const [r1, g1, b1] = parse(hexA)
  const [r2, g2, b2] = parse(hexB)
  const c = (a: number, b: number) => Math.round(b + (a - b) * amount)
  return `#${[c(r1, r2), c(g1, g2), c(b1, b2)]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')}`
}

/**
 * Schlagschatten als versetzte Grundriss-Flächen unter den Extrusionen.
 * MapLibre wirft keine echten Schatten, deshalb drei Höhenklassen mit
 * unterschiedlichem Versatz — hohe Häuser werfen längere Schatten.
 *
 * Der Schatten wird deckend gezeichnet (Farbe vorab mit dem Untergrund
 * gemischt), sonst würde die Konturlinie die Fläche doppelt abdunkeln.
 * Diese Konturlinie mit runden Ecken rundet die Schattenform ab.
 */
function shadowLayers(
  theme: Theme,
  opts: StyleOptions,
): StyleSpecification['layers'] {
  if (!opts.shadowOn) return []

  const rad = ((opts.shadowAngle - 90) * Math.PI) / 180
  const color = mix(theme.shadow, theme.background, opts.shadowOpacity)
  const buckets: Array<{ id: string; filter: unknown; factor: number }> = [
    { id: 'low', filter: ['<', ['coalesce', ['get', 'render_height'], 8], 12], factor: 0.55 },
    {
      id: 'mid',
      filter: [
        'all',
        ['>=', ['coalesce', ['get', 'render_height'], 8], 12],
        ['<', ['coalesce', ['get', 'render_height'], 8], 30],
      ],
      factor: 1,
    },
    { id: 'high', filter: ['>=', ['coalesce', ['get', 'render_height'], 8], 30], factor: 1.9 },
  ]

  return buckets.flatMap(({ id, filter, factor }) => {
    const len = opts.shadowLength * factor
    const translate: [number, number] = [
      Number((Math.cos(rad) * len).toFixed(2)),
      Number((Math.sin(rad) * len).toFixed(2)),
    ]

    const layers = [
      {
        id: `building-shadow-${id}`,
        type: 'fill',
        source: 'osm',
        'source-layer': 'building',
        minzoom: 13,
        filter,
        paint: {
          'fill-color': color,
          'fill-translate': translate,
          'fill-translate-anchor': 'map',
        },
      },
    ]

    if (opts.cornerRadius > 0) {
      layers.push({
        id: `building-shadow-${id}-round`,
        type: 'line',
        source: 'osm',
        'source-layer': 'building',
        minzoom: 13,
        filter,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': color,
          'line-width': opts.cornerRadius * 2,
          'line-translate': translate,
          'line-translate-anchor': 'map',
        },
      } as never)
    }

    return layers as StyleSpecification['layers']
  })
}

export function buildStyle(theme: Theme, opts: StyleOptions): StyleSpecification {
  const t = theme
  const h = opts.heightFactor

  // Fehlt in OSM die Höhe, mit 8 m rechnen — sonst lägen die Häuser flach
  const buildingHeight: ExpressionSpecification = [
    '*',
    ['coalesce', ['get', 'render_height'], 8],
    h,
  ]
  const buildingBase: ExpressionSpecification = [
    '*',
    ['coalesce', ['get', 'render_min_height'], 0],
    h,
  ]

  const notTunnel: ExpressionSpecification = ['!=', ['get', 'brunnel'], 'tunnel']

  // Linienebenen zeichnen sonst auch die Umrisse von Flächen — etwa die
  // Kante rund um Perronflächen. Deshalb überall auf Linien einschränken.
  const isLine: ExpressionSpecification = [
    'match',
    ['geometry-type'],
    ['LineString', 'MultiLineString'],
    true,
    false,
  ]

  const tunnelRailLayers: StyleSpecification['layers'] = opts.showTunnels
    ? [
        {
          id: 'rail-tunnel',
          type: 'line',
          source: 'osm',
          'source-layer': 'transportation',
          filter: [
            'all',
            ['==', ['get', 'brunnel'], 'tunnel'],
            ['match', ['get', 'class'], ['rail', 'transit'], true, false],
          ],
          paint: {
            'line-color': t.rail,
            'line-dasharray': [3, 3],
            'line-opacity': 0.5,
            'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 13, 1, 18, 3],
          },
        },
      ]
    : []

  // Dunkle Konturlinie am Strassenrand — im Mono-Look abgeschaltet,
  // dort sollen die weissen Strassen randlos in die Grundfläche laufen.
  // Nur benannte Wege: die Namen liegen in einer eigenen Vektorebene, die
  // ausschliesslich benannte Linien enthält — unbenannte Trampelpfade,
  // Zufahrten und Verbindungsstücke fallen damit automatisch weg.
  const NAMED = 'transportation_name'
  // Diese Ebene führt kein brunnel-Feld; negative layer-Werte sind der
  // beste verfügbare Hinweis auf Unterführungen.
  const notBelowGround: ExpressionSpecification = [
    'any',
    ['!', ['has', 'layer']],
    ['>=', ['coalesce', ['get', 'layer'], 0], 0],
  ]

  const roadCasingLayers: StyleSpecification['layers'] = theme.roadOutline
    ? [
      {
        id: 'road-path-casing',
        type: 'line',
        source: 'osm',
        'source-layer': NAMED,
        minzoom: 14,
        filter: ['all', notBelowGround, ['match', ['get', 'class'], ['path', 'pedestrian'], true, false]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': t.roadCasing,
          'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 14, 2, 19, 8],
          'line-opacity': 0.5,
        },
      },
      {
        id: 'road-minor-casing',
        type: 'line',
        source: 'osm',
        'source-layer': NAMED,
        filter: ['all', notBelowGround, ['match', ['get', 'class'], ['minor', 'service', 'track'], true, false]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': t.roadCasing,
          'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 13, 2, 19, 22],
        },
      },
      {
        id: 'road-major-casing',
        type: 'line',
        source: 'osm',
        'source-layer': NAMED,
        filter: [
          'all',
          notBelowGround,
          ['match', ['get', 'class'], ['motorway', 'trunk', 'primary', 'secondary', 'tertiary'], true, false],
        ],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': t.roadCasing,
          'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 13, 4, 19, 34],
        },
      },
      ]
    : []

  const labelLayers: StyleSpecification['layers'] = opts.showLabels
    ? [
        {
          id: 'label-street',
          type: 'symbol',
          source: 'osm',
          'source-layer': 'transportation_name',
          minzoom: 14,
          filter: ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false],
          layout: {
            'symbol-placement': 'line',
            'text-field': ['get', 'name'],
            'text-font': ['Noto Sans Regular'],
            'text-size': 13,
            'text-letter-spacing': 0.02,
            'text-max-angle': 30,
            'text-pitch-alignment': 'viewport',
          },
          paint: {
            'text-color': t.label,
            'text-halo-color': t.labelHalo,
            'text-halo-width': 1.6,
          },
        },
        {
          id: 'label-place',
          type: 'symbol',
          source: 'osm',
          'source-layer': 'place',
          filter: ['match', ['get', 'class'], ['suburb', 'neighbourhood', 'quarter'], true, false],
          layout: {
            'text-field': ['get', 'name'],
            'text-font': ['Noto Sans Bold'],
            'text-size': 16,
            'text-letter-spacing': 0.08,
            'text-transform': 'uppercase',
            'text-pitch-alignment': 'viewport',
          },
          paint: {
            'text-color': t.label,
            'text-halo-color': t.labelHalo,
            'text-halo-width': 2,
            'text-opacity': 0.7,
          },
        },
      ]
    : []

  return {
    version: 8,
    name: `ZVV Map – ${t.name}`,
    glyphs: GLYPHS_URL,
    light: {
      anchor: 'viewport',
      color: '#ffffff',
      intensity: t.lightIntensity,
      position: [1.5, 200, 40],
    },
    sources: {
      osm: { type: 'vector', url: TILES_URL },
    },
    layers: [
      { id: 'background', type: 'background', paint: { 'background-color': t.background } },

      // --- Flächen ---
      {
        id: 'landuse',
        type: 'fill',
        source: 'osm',
        'source-layer': 'landuse',
        filter: [
          'match',
          ['get', 'class'],
          ['residential', 'commercial', 'industrial', 'retail', 'railway'],
          true,
          false,
        ],
        paint: { 'fill-color': t.landuse },
      },
      {
        id: 'park',
        type: 'fill',
        source: 'osm',
        'source-layer': 'park',
        paint: { 'fill-color': t.green, 'fill-opacity': 0.85 },
      },
      {
        id: 'landcover-green',
        type: 'fill',
        source: 'osm',
        'source-layer': 'landcover',
        filter: ['match', ['get', 'class'], ['wood', 'grass'], true, false],
        paint: { 'fill-color': t.green },
      },
      {
        id: 'water',
        type: 'fill',
        source: 'osm',
        'source-layer': 'water',
        filter: ['!=', ['get', 'brunnel'], 'tunnel'],
        paint: { 'fill-color': t.water },
      },
      {
        // Plätze, Perronflächen, Fussgängerzonen (Polygone im transportation-Layer)
        id: 'pedestrian-area',
        type: 'fill',
        source: 'osm',
        'source-layer': 'transportation',
        filter: ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false],
        paint: { 'fill-color': t.pedestrian },
      },
      {
        // Perrons und Haltekanten-Vorplätze — für die Kioskkarte die
        // wichtigste Bodenfläche, deshalb eigener Ton über den übrigen.
        id: 'platform-area',
        type: 'fill',
        source: 'osm',
        'source-layer': 'transportation',
        filter: [
          'all',
          ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false],
          ['==', ['get', 'subclass'], 'platform'],
        ],
        paint: { 'fill-color': t.platform },
      },

      // --- Strassen: Casing unten, Fahrbahn oben ---
      ...roadCasingLayers,
      {
        // Fuss- und Radwege: bekamen bisher nur eine Kontur, aber keine
        // eigene Fahrbahn — im Mono-Look blieben sie deshalb grau.
        id: 'road-path',
        type: 'line',
        source: 'osm',
        'source-layer': NAMED,
        minzoom: 14,
        filter: [
          'all',
          isLine,
          notBelowGround,
          ['match', ['get', 'class'], ['path', 'pedestrian'], true, false],
          ['!=', ['get', 'subclass'], 'platform'],
        ],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': t.roadPath,
          'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 14, 1.5, 19, 7],
        },
      },
      {
        id: 'road-minor',
        type: 'line',
        source: 'osm',
        'source-layer': NAMED,
        filter: [
          'all',
          isLine,
          notBelowGround,
          ['match', ['get', 'class'], ['minor', 'service', 'track'], true, false],
        ],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': t.roadMinor,
          'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 13, 1, 19, 18],
        },
      },
      {
        id: 'road-major',
        type: 'line',
        source: 'osm',
        'source-layer': NAMED,
        filter: [
          'all',
          isLine,
          notBelowGround,
          ['match', ['get', 'class'], ['motorway', 'trunk', 'primary', 'secondary', 'tertiary'], true, false],
        ],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': t.roadMajor,
          'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 13, 3, 19, 28],
        },
      },

      // --- Schiene ---
      // Unterirdische Strecken nur, wenn ausdrücklich gewünscht: sonst
      // laufen S-Bahn-Tunnel sichtbar durch Wasser und Gebäude.
      ...tunnelRailLayers,

      // Tram und Stadtbahn: feiner als die Eisenbahn, ebenfalls mit Schwellen
      {
        id: 'rail-tram',
        type: 'line',
        source: 'osm',
        'source-layer': 'transportation',
        filter: ['all', isLine, notTunnel, ['==', ['get', 'class'], 'transit']],
        layout: { 'line-cap': 'round' },
        paint: {
          'line-color': t.railTram,
          'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 13, 1.2, 18, 4.5],
        },
      },
      {
        id: 'rail-tram-hatching',
        type: 'line',
        source: 'osm',
        'source-layer': 'transportation',
        minzoom: 15,
        filter: ['all', isLine, notTunnel, ['==', ['get', 'class'], 'transit']],
        paint: {
          'line-color': t.railTram,
          'line-dasharray': [0.2, 2],
          'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 15, 3, 18, 9],
        },
      },
      // Eisenbahn (Zug, S-Bahn): kräftiger, mit Schwellen
      {
        id: 'rail',
        type: 'line',
        source: 'osm',
        'source-layer': 'transportation',
        filter: ['all', isLine, notTunnel, ['==', ['get', 'class'], 'rail']],
        layout: { 'line-cap': 'round' },
        paint: {
          'line-color': t.rail,
          'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 13, 1.5, 18, 6],
        },
      },
      {
        id: 'rail-hatching',
        type: 'line',
        source: 'osm',
        'source-layer': 'transportation',
        minzoom: 15,
        filter: ['all', isLine, notTunnel, ['==', ['get', 'class'], 'rail']],
        paint: {
          'line-color': t.rail,
          'line-dasharray': [0.2, 2],
          'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 15, 4, 18, 12],
        },
      },

      // --- Gebäude: erst Schatten, dann Baukörper ---
      ...shadowLayers(t, opts),
      // Wände: der eigentliche Baukörper
      {
        id: 'building-3d',
        type: 'fill-extrusion',
        source: 'osm',
        'source-layer': 'building',
        minzoom: 13,
        paint: {
          'fill-extrusion-color': t.buildingSide,
          'fill-extrusion-height': buildingHeight,
          'fill-extrusion-base': buildingBase,
          'fill-extrusion-opacity': opts.buildingOpacity,
          // Verlauf nur, wo die Wandschattierung überhaupt Kontrast hat
          'fill-extrusion-vertical-gradient': t.lightIntensity > 0.2,
        },
      },
      // Dachfläche: dünne Platte oben auf den Wänden. MapLibre kann Dach und
      // Wand nicht getrennt einfärben — deshalb die zweite Extrusion.
      {
        id: 'building-3d-roof',
        type: 'fill-extrusion',
        source: 'osm',
        'source-layer': 'building',
        minzoom: 13,
        paint: {
          'fill-extrusion-color': t.buildingTop,
          'fill-extrusion-height': buildingHeight,
          'fill-extrusion-base': ['max', ['-', buildingHeight, 0.6], buildingBase],
          'fill-extrusion-opacity': opts.buildingOpacity,
          'fill-extrusion-vertical-gradient': false,
        },
      },

      ...labelLayers,
    ],
  }
}
