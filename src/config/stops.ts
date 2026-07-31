/**
 * Auswahl komplexer ZVV-Haltestellen für den Look-Prototyp.
 * Die Koordinaten sind Näherungswerte für den Haltestellen-Mittelpunkt und
 * lassen sich in der Vorschau per Drag feinjustieren.
 */
export type Stop = {
  id: string
  name: string
  center: [number, number] // [lng, lat]
}

export const STOPS: Stop[] = [
  { id: 'bellevue', name: 'Zürich, Bellevue', center: [8.5448, 47.3668] },
  { id: 'central', name: 'Zürich, Central', center: [8.5439, 47.3765] },
  { id: 'bahnhofplatz', name: 'Zürich, Bahnhofplatz/HB', center: [8.5403, 47.3779] },
  { id: 'stadelhofen', name: 'Zürich, Bahnhof Stadelhofen', center: [8.5484, 47.3665] },
  { id: 'paradeplatz', name: 'Zürich, Paradeplatz', center: [8.5386, 47.3697] },
  { id: 'escherwyss', name: 'Zürich, Escher-Wyss-Platz', center: [8.5197, 47.3899] },
  { id: 'bucheggplatz', name: 'Zürich, Bucheggplatz', center: [8.5296, 47.3959] },
  { id: 'oerlikon', name: 'Zürich, Bahnhof Oerlikon', center: [8.5442, 47.4118] },
  { id: 'winterthur', name: 'Winterthur, Hauptbahnhof', center: [8.7241, 47.5002] },
  { id: 'uster', name: 'Uster, Bahnhof', center: [8.7181, 47.3497] },
]
