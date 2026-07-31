# ZVV Map

Kioskkarte für komplexe ZVV-Haltestellen: Sie zeigt Fahrgästen vor Ort, wo die
Haltekanten liegen. Die Karte steht an zentraler Stelle im Format 1920 × 1920
und stellt Gebäude leicht dreidimensional dar, mit angekippter Kamera.

Aktueller Stand: **Look-Prototyp**. Die Haltekanten sind noch nicht eingezeichnet
— es geht zunächst um Farbwelt, Kameraführung und Kartendetail.

## Entwicklung

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # Produktionsbuild nach dist/
```

Im Vorschaufenster liegt rechts ein Panel zum Einstellen von Haltestelle,
Farbwelt, Neigung, Drehung, Zoom, Gebäudehöhe und Schatten. `P` blendet es aus.
„Config kopieren" legt den aktuellen Kamerastand als JSON in die Zwischenablage.
Einstellungen bleiben im Browser gespeichert.

## Aufbau

| Datei | Inhalt |
| --- | --- |
| `src/map/themes.ts` | Farbwelten als Token-Sets — hier wird der Look eingestellt |
| `src/map/buildStyle.ts` | erzeugt daraus die MapLibre-Style-Spec |
| `src/config/stops.ts` | Haltestellen-Presets |
| `src/types.ts` | Ansichtszustand und Startwerte |

## Kartendaten

Vektor-Tiles von [OpenFreeMap](https://openfreemap.org) auf Basis von
OpenStreetMap — kostenlos, ohne API-Key. Die Quell-URLs stehen gesammelt am
Anfang von `src/map/buildStyle.ts` und lassen sich gegen MapTiler oder ein
selbst gehostetes PMTiles-Archiv tauschen. Für den späteren Kioskbetrieb ist
Self-Hosting vorgesehen, damit die Karte nicht von einem fremden Dienst abhängt
und offline lauffähig bleibt.

Zwei Grenzen von MapLibre, die den Look betreffen: Es gibt keinen echten
Schattenwurf — die Schlagschatten sind als versetzte Grundrisse in drei
Höhenklassen nachgebaut. Und Extrusionen lassen sich nicht abrunden, die
Dachkanten bleiben also scharf.

## Deployment

Vercel baut den `main`-Branch automatisch. Framework-Preset: Vite,
Build-Befehl `npm run build`, Ausgabeverzeichnis `dist`.
