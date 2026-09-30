'use client'

import type { CSSProperties } from 'react'
import type { ThemeSpecController } from '@/lib/use-theme-spec'
import { PRESET_OPTIONS, RADIUS_OPTIONS } from '@/lib/default-theme'

export function ThemeControls({ ctrl }: { ctrl: ThemeSpecController }) {
  const brand = ctrl.spec.scales.find((s) => s.role === 'brand')

  return (
    <section style={section}>
      <h2 style={heading}>Theme</h2>

      <label style={field}>
        <span style={label}>Name</span>
        <input
          value={ctrl.spec.name}
          onChange={(e) => ctrl.setName(e.target.value)}
          style={input}
        />
      </label>

      <label style={field}>
        <span style={label}>Brand color</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="color"
            value={normalizeHex(brand?.baseColor ?? '#0D7377')}
            onChange={(e) => ctrl.setBrandColor(e.target.value.toUpperCase())}
            style={{ width: 44, height: 36, padding: 0, border: '1px solid var(--shell-border)', borderRadius: 8, background: 'transparent', cursor: 'pointer' }}
            aria-label="Brand color picker"
          />
          <input
            value={brand?.baseColor ?? ''}
            onChange={(e) => {
              const v = e.target.value
              if (/^#[0-9a-fA-F]{6}$/.test(v)) ctrl.setBrandColor(v.toUpperCase())
            }}
            style={{ ...input, fontFamily: 'var(--font-mono)', flex: 1 }}
            spellCheck={false}
          />
        </div>
      </label>

      <label style={field}>
        <span style={label}>Preset</span>
        <select
          value={ctrl.spec.generation.presetId}
          onChange={(e) => ctrl.setPreset(e.target.value)}
          style={input}
        >
          {PRESET_OPTIONS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      <label style={field}>
        <span style={label}>Radius</span>
        <select
          value={ctrl.spec.radius ?? 'md'}
          onChange={(e) =>
            ctrl.setRadius(e.target.value as NonNullable<(typeof RADIUS_OPTIONS)[number]>)
          }
          style={input}
        >
          {RADIUS_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>

      <label style={field}>
        <span style={label}>Neutral</span>
        <select
          value={ctrl.spec.neutral.mode}
          onChange={(e) =>
            ctrl.setNeutralMode(e.target.value as typeof ctrl.spec.neutral.mode)
          }
          style={input}
        >
          <option value="tinted">Tinted</option>
          <option value="warm">Warm</option>
          <option value="cool">Cool</option>
          <option value="custom">Custom</option>
        </select>
      </label>
    </section>
  )
}

function normalizeHex(hex: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex.toLowerCase()
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    const r = hex[1]!
    const g = hex[2]!
    const b = hex[3]!
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
  }
  return '#0d7377'
}

const section: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: 14,
  border: '1px solid var(--shell-border)',
  borderRadius: 12,
  background: 'var(--shell-bg)',
}

const heading: CSSProperties = {
  margin: 0,
  fontSize: 13,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--shell-muted)',
}

const field: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 }

const label: CSSProperties = { fontSize: 12, color: 'var(--shell-muted)', fontWeight: 560 }

const input: CSSProperties = {
  border: '1px solid var(--shell-border)',
  borderRadius: 8,
  padding: '8px 10px',
  background: 'var(--shell-panel)',
  color: 'var(--shell-fg)',
}
