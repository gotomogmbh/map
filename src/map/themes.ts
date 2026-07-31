/**
 * Farbwelten für die Kioskkarte. Ein Theme ist ein reines Token-Set —
 * buildStyle() erzeugt daraus die komplette MapLibre-Style-Spec.
 */
export type Theme = {
  id: string
  name: string
  background: string
  water: string
  green: string
  landuse: string
  /** Fussgängerflächen und Plätze */
  pedestrian: string
  /** Perrons und Haltekanten-Vorplätze */
  platform: string
  roadMajor: string
  roadMinor: string
  /** Fuss- und Radwege — bewusst etwas gedämpfter als die Fahrbahnen */
  roadPath: string
  roadCasing: string
  /** Eisenbahn (Zug, S-Bahn) — ein Grauton für Schiene und Schwellen */
  rail: string
  /** Tram und Stadtbahn — feiner als die Eisenbahn */
  railTram: string
  buildingSide: string
  buildingTop: string
  /** Farbe des Schlagschattens unter den Gebäuden */
  shadow: string
  label: string
  labelHalo: string
  /** Dunkle Konturlinie am Strassenrand — im Mono-Look bewusst aus */
  roadOutline: boolean
  /** Kontrast der Wandschattierung, 0 = flach, 1 = hart */
  lightIntensity: number
}

export const THEMES: Theme[] = [
  {
    id: 'hell',
    name: 'Hell / Clean',
    background: '#e7eaee',
    water: '#a6c8e0',
    green: '#c7d5cd',
    landuse: '#e1e5ea',
    pedestrian: '#dadee5',
    platform: '#cbd2dc',
    roadMajor: '#ffffff',
    roadMinor: '#ffffff',
    roadPath: '#edf0f3',
    roadCasing: '#ccd2da',
    rail: '#97a0ac',
    railTram: '#aab1bb',
    buildingSide: '#c8cfd9',
    buildingTop: '#e2e7ed',
    shadow: '#5c6673',
    label: '#3c4350',
    labelHalo: '#f1f4f8',
    roadOutline: true,
    lightIntensity: 0.35,
  },
  {
    id: 'dunkel',
    name: 'Dunkel / Nacht',
    background: '#1b1e24',
    water: '#16303f',
    green: '#152425',
    landuse: '#22262d',
    pedestrian: '#272b33',
    platform: '#343b45',
    roadMajor: '#333944',
    roadMinor: '#333944',
    roadPath: '#363d48',
    roadCasing: '#20242b',
    rail: '#4e5563',
    railTram: '#6c7583',
    buildingSide: '#343b45',
    buildingTop: '#454d59',
    shadow: '#0a0c10',
    label: '#e6e8ec',
    labelHalo: '#14171c',
    roadOutline: true,
    lightIntensity: 0.35,
  },
  {
    id: 'kontrast',
    name: 'Kontrast / Wayfinding',
    background: '#eceef3',
    water: '#89b8d6',
    green: '#bccfc4',
    landuse: '#e3e7ed',
    pedestrian: '#d3d8e1',
    platform: '#c3cad6',
    roadMajor: '#ffffff',
    roadMinor: '#ffffff',
    roadPath: '#eef1f5',
    roadCasing: '#a7b0bd',
    rail: '#6d7684',
    railTram: '#868e9a',
    buildingSide: '#adb6c3',
    buildingTop: '#d6dce4',
    shadow: '#454d59',
    label: '#222831',
    labelHalo: '#ffffff',
    roadOutline: true,
    lightIntensity: 0.35,
  },
  {
    // Nach dem Vorbild der Tesla-Onboard-Karte: praktisch monochrom,
    // weisse Strassen auf hellem Grau, Gebäude nur über Schatten lesbar.
    id: 'mono',
    name: 'Mono / Tesla-Look',
    // Heller Boden, helle Gebäudeseiten, dunklere Dachflächen — die
    // Baukörper lesen sich über die Dachfläche, nicht über die Silhouette.
    background: '#e4e7e9',
    water: '#dbdfe2',
    green: '#dadcd7',
    landuse: '#e4e7e9',
    pedestrian: '#f4f6f7',
    platform: '#e8ebed',
    roadMajor: '#ffffff',
    roadMinor: '#ffffff',
    roadPath: '#f1f3f5',
    roadCasing: '#e4e7e9',
    rail: '#c9cdd0',
    railTram: '#d5d9db',
    buildingSide: '#d8dbdf',
    buildingTop: '#f2f4f6',
    shadow: '#7d848a',
    label: '#585e65',
    labelHalo: '#ffffff',
    roadOutline: false,
    lightIntensity: 0.12,
  },
]

export const themeById = (id: string): Theme =>
  THEMES.find((t) => t.id === id) ?? THEMES[0]
