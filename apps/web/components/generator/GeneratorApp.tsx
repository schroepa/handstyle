'use client'

import { useState, type CSSProperties } from 'react'
import { useThemeSpec, type ThemeSpecController } from '@/lib/use-theme-spec'
import { ThemeControls } from './ThemeControls'
import { ScaleRows } from './ScaleRows'
import { ContrastPanel } from './ContrastPanel'
import { ExportBar } from './ExportBar'
import { ThemePreview } from '@/components/preview/ThemePreview'

export function GeneratorApp() {
  const ctrl = useThemeSpec()
  const [mobileOpen, setMobileOpen] = useState(false)

  const controls = (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p
          style={{
            margin: 0,
            fontSize: 12,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--shell-muted)',
            fontWeight: 600,
          }}
        >
          Handstyle
        </p>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em' }}>
          Theme Generator
        </h1>
        <p style={{ margin: 0, color: 'var(--shell-muted)', fontSize: 14, lineHeight: 1.45 }}>
          Pick a brand color, audit contrast, preview surfaces, share a URL.
        </p>
      </header>

      <ThemeControls ctrl={ctrl} />
      <ScaleRows ctrl={ctrl} />
      <ContrastPanel ctrl={ctrl} />
      <ExportBar ctrl={ctrl} />
    </div>
  )

  return (
    <div
      style={{
        minHeight: '100svh',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
      }}
      className="generator-shell"
    >
      <style id="handstyle-theme-vars">{ctrl.previewCss}</style>
      <style>{`
        @media (min-width: 960px) {
          .generator-shell {
            grid-template-columns: minmax(320px, 420px) minmax(0, 1fr) !important;
          }
          .generator-mobile-bar { display: none !important; }
          .generator-sheet { display: none !important; }
          .generator-desktop-controls { display: block !important; }
        }
        @media (max-width: 959px) {
          .generator-desktop-controls { display: none !important; }
        }
      `}</style>

      <aside
        className="generator-desktop-controls"
        style={{
          display: 'none',
          borderRight: '1px solid var(--shell-border)',
          background: 'var(--shell-panel)',
          padding: '24px 20px 40px',
          overflow: 'auto',
          maxHeight: '100svh',
          position: 'sticky',
          top: 0,
        }}
      >
        {controls}
      </aside>

      <main style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh' }}>
        <div
          className="generator-mobile-bar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '12px 16px',
            borderBottom: '1px solid var(--shell-border)',
            background: 'var(--shell-panel)',
            position: 'sticky',
            top: 0,
            zIndex: 20,
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Handstyle</div>
            <div style={{ fontSize: 12, color: 'var(--shell-muted)' }}>{ctrl.spec.name}</div>
          </div>
          <button type="button" onClick={() => setMobileOpen(true)} style={barBtn}>
            Controls
          </button>
        </div>

        <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <ModeToggle ctrl={ctrl} />
          </div>
          <ThemePreview mode={ctrl.previewMode} />
        </div>
      </main>

      {mobileOpen ? (
        <div
          className="generator-sheet"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'flex-end',
          }}
          onClick={() => setMobileOpen(false)}
        >
          <div
            role="dialog"
            aria-label="Theme controls"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxHeight: '88svh',
              overflow: 'auto',
              background: 'var(--shell-panel)',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: '16px 16px 28px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <strong>Controls</strong>
              <button type="button" onClick={() => setMobileOpen(false)} style={barBtn}>
                Close
              </button>
            </div>
            {controls}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ModeToggle({ ctrl }: { ctrl: ThemeSpecController }) {
  return (
    <div
      role="group"
      aria-label="Preview mode"
      style={{
        display: 'inline-flex',
        border: '1px solid var(--shell-border)',
        borderRadius: 8,
        overflow: 'hidden',
        background: 'var(--shell-panel)',
      }}
    >
      {(['light', 'dark'] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => ctrl.setPreviewMode(mode)}
          style={{
            ...barBtn,
            borderRadius: 0,
            border: 'none',
            background: ctrl.previewMode === mode ? 'var(--shell-fg)' : 'transparent',
            color: ctrl.previewMode === mode ? 'var(--shell-panel)' : 'var(--shell-fg)',
          }}
        >
          {mode}
        </button>
      ))}
    </div>
  )
}

const barBtn: CSSProperties = {
  border: '1px solid var(--shell-border)',
  background: 'var(--shell-bg)',
  color: 'var(--shell-fg)',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 13,
  fontWeight: 560,
  cursor: 'pointer',
}
