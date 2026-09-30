'use client'

import type { CSSProperties } from 'react'

export function PreviewSurfaces() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <SurfaceStack />
      <CardBlock />
      <FormBlock />
      <StatusRow />
      <DataDots />
    </div>
  )
}

function SurfaceStack() {
  const layers: { name: string; bg: string }[] = [
    { name: 'canvas', bg: 'var(--bg-canvas)' },
    { name: 'surface', bg: 'var(--bg-surface)' },
    { name: 'elevated', bg: 'var(--bg-elevated)' },
    { name: 'subtle', bg: 'var(--bg-subtle)' },
    { name: 'muted', bg: 'var(--bg-muted)' },
  ]

  return (
    <section>
      <SectionLabel>Surfaces</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 8 }}>
        {layers.map((layer) => (
          <div
            key={layer.name}
            style={{
              background: layer.bg,
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius)',
              padding: '12px 10px',
              minHeight: 72,
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{layer.name}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)' }}>Aa</div>
            <div style={{ fontSize: 11, color: 'var(--fg-secondary)' }}>secondary</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function CardBlock() {
  return (
    <section>
      <SectionLabel>Card & CTA</SectionLabel>
      <div
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius)',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          maxWidth: 420,
        }}
      >
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg-primary)' }}>
            Product update
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--fg-secondary)', lineHeight: 1.45 }}>
            Your theme tokens drive surfaces, text, borders, and brand actions without hard-coded
            palette classes.
          </p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button type="button" style={primaryBtn}>
            Primary action
          </button>
          <button type="button" style={ghostBtn}>
            Secondary
          </button>
        </div>
      </div>
    </section>
  )
}

function FormBlock() {
  return (
    <section>
      <SectionLabel>Form</SectionLabel>
      <div
        style={{
          display: 'grid',
          gap: 10,
          maxWidth: 420,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius)',
          padding: 14,
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Email</span>
          <input
            defaultValue="you@studio.dev"
            style={{
              border: '1px solid var(--border-default)',
              background: 'var(--bg-elevated)',
              color: 'var(--fg-primary)',
              borderRadius: 'calc(var(--radius) * 0.85)',
              padding: '9px 11px',
            }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Workspace</span>
          <input
            defaultValue="Handstyle"
            style={{
              border: '1px solid var(--border-brand)',
              background: 'var(--bg-elevated)',
              color: 'var(--fg-primary)',
              borderRadius: 'calc(var(--radius) * 0.85)',
              padding: '9px 11px',
              boxShadow: '0 0 0 3px color-mix(in oklab, var(--ring-focus) 25%, transparent)',
            }}
          />
        </label>
      </div>
    </section>
  )
}

function StatusRow() {
  const items = [
    { label: 'Success', fg: 'var(--status-success)', bg: 'var(--status-success-bg)' },
    { label: 'Warning', fg: 'var(--status-warning)', bg: 'var(--status-warning-bg)' },
    { label: 'Danger', fg: 'var(--status-danger)', bg: 'var(--status-danger-bg)' },
    { label: 'Info', fg: 'var(--status-info)', bg: 'var(--status-info-bg)' },
  ] as const

  return (
    <section>
      <SectionLabel>Status</SectionLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {items.map((item) => (
          <span
            key={item.label}
            style={{
              background: item.bg,
              color: item.fg,
              borderRadius: 999,
              padding: '6px 10px',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {item.label}
          </span>
        ))}
      </div>
    </section>
  )
}

function DataDots() {
  const colors = [
    'var(--data-1)',
    'var(--data-2)',
    'var(--data-3)',
    'var(--data-4)',
    'var(--data-5)',
  ]
  return (
    <section>
      <SectionLabel>Data</SectionLabel>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {colors.map((c, i) => (
          <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                background: c,
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>series {i + 1}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        marginBottom: 8,
        fontSize: 11,
        fontWeight: 650,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        color: 'var(--fg-muted)',
      }}
    >
      {children}
    </div>
  )
}

const primaryBtn: CSSProperties = {
  border: 'none',
  background: 'var(--bg-brand)',
  color: 'var(--fg-on-brand)',
  borderRadius: 'var(--radius)',
  padding: '9px 14px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
}

const ghostBtn: CSSProperties = {
  border: '1px solid var(--border-default)',
  background: 'var(--bg-subtle)',
  color: 'var(--fg-primary)',
  borderRadius: 'var(--radius)',
  padding: '9px 14px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
}
