'use client'

import { PreviewSurfaces } from './PreviewSurfaces'

export function ThemePreview({ mode }: { mode: 'light' | 'dark' }) {
  return (
    <div
      className={mode === 'dark' ? 'hs-preview dark' : 'hs-preview'}
      style={{
        flex: 1,
        minHeight: 480,
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid var(--shell-border)',
        background: 'var(--bg-canvas)',
        color: 'var(--fg-primary)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.06)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '14px 18px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Live preview</div>
          <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
            Curated surfaces · semantic tokens only
          </div>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--fg-brand)',
            background: 'var(--bg-brand-subtle)',
            border: '1px solid var(--border-brand)',
            borderRadius: 'calc(var(--radius) * 0.8)',
            padding: '4px 8px',
          }}
        >
          {mode}
        </span>
      </div>
      <div style={{ padding: 18 }}>
        <PreviewSurfaces />
      </div>
    </div>
  )
}
