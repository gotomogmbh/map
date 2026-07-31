import { useState } from 'react'
import { STOPS } from '../config/stops'
import { THEMES } from '../map/themes'
import type { ViewState } from '../types'
import { DEFAULT_VIEW } from '../types'

type Props = {
  view: ViewState
  onChange: (v: Partial<ViewState>) => void
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  onChange: (v: number) => void
}) {
  return (
    <label className="control">
      <span className="control-label">
        {label}
        <b>
          {value}
          {unit}
        </b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

export function ControlPanel({ view, onChange }: Props) {
  const [copied, setCopied] = useState(false)

  const copyConfig = async () => {
    await navigator.clipboard.writeText(JSON.stringify(view, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <aside className="panel">
      <h1>ZVV Map — Look-Prototyp</h1>
      <p className="hint">
        Karte per Drag verschieben, mit <kbd>Ctrl</kbd>/rechte Maustaste + Drag drehen und kippen.
      </p>

      <label className="control">
        <span className="control-label">Haltestelle</span>
        <select
          value={view.stopId}
          onChange={(e) => {
            const stop = STOPS.find((s) => s.id === e.target.value)!
            onChange({ stopId: stop.id, center: stop.center })
          }}
        >
          {STOPS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      <label className="control">
        <span className="control-label">Farbwelt</span>
        <select value={view.themeId} onChange={(e) => onChange({ themeId: e.target.value })}>
          {THEMES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>

      <Slider
        label="Neigung"
        value={view.pitch}
        min={0}
        max={75}
        step={1}
        unit="°"
        onChange={(pitch) => onChange({ pitch })}
      />
      <Slider
        label="Drehung"
        value={view.bearing}
        min={-180}
        max={180}
        step={1}
        unit="°"
        onChange={(bearing) => onChange({ bearing })}
      />
      <Slider
        label="Zoom"
        value={view.zoom}
        min={14}
        max={19}
        step={0.1}
        onChange={(zoom) => onChange({ zoom })}
      />
      <Slider
        label="Gebäudehöhe"
        value={view.heightFactor}
        min={0.5}
        max={3}
        step={0.1}
        unit="×"
        onChange={(heightFactor) => onChange({ heightFactor })}
      />
      <Slider
        label="Gebäude-Deckkraft"
        value={view.buildingOpacity}
        min={0.3}
        max={1}
        step={0.05}
        onChange={(buildingOpacity) => onChange({ buildingOpacity })}
      />

      <label className="control control-row">
        <input
          type="checkbox"
          checked={view.showLabels}
          onChange={(e) => onChange({ showLabels: e.target.checked })}
        />
        <span>Strassennamen zeigen</span>
      </label>

      <label className="control control-row">
        <input
          type="checkbox"
          checked={view.showTunnels}
          onChange={(e) => onChange({ showTunnels: e.target.checked })}
        />
        <span>Bahntunnel zeigen</span>
      </label>

      <label className="control control-row">
        <input
          type="checkbox"
          checked={view.shadowOn}
          onChange={(e) => onChange({ shadowOn: e.target.checked })}
        />
        <span>Gebäudeschatten</span>
      </label>

      {view.shadowOn && (
        <>
          <Slider
            label="Sonnenrichtung"
            value={view.shadowAngle}
            min={0}
            max={360}
            step={5}
            unit="°"
            onChange={(shadowAngle) => onChange({ shadowAngle })}
          />
          <Slider
            label="Schattenlänge"
            value={view.shadowLength}
            min={0}
            max={40}
            step={1}
            unit=" px"
            onChange={(shadowLength) => onChange({ shadowLength })}
          />
          <Slider
            label="Schattenstärke"
            value={view.shadowOpacity}
            min={0.05}
            max={0.6}
            step={0.01}
            onChange={(shadowOpacity) => onChange({ shadowOpacity })}
          />
          <Slider
            label="Ecken runden"
            value={view.cornerRadius}
            min={0}
            max={8}
            step={0.5}
            unit=" px"
            onChange={(cornerRadius) => onChange({ cornerRadius })}
          />
        </>
      )}

      <div className="panel-actions">
        <button onClick={copyConfig}>{copied ? 'Kopiert ✓' : 'Config kopieren'}</button>
        <button className="ghost" onClick={() => onChange(DEFAULT_VIEW)}>
          Zurücksetzen
        </button>
      </div>

      <pre className="config-preview">{JSON.stringify(view, null, 2)}</pre>
    </aside>
  )
}
