'use client'

import type { CSSProperties } from 'react'
import type { ThemeSpecController } from '@/lib/use-theme-spec'

export function ExportBar({ ctrl }: { ctrl: ThemeSpecController }) {
  return (
    <section style={section}>
      <h2 style={heading}>Export & share</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button type="button" style={btn} onClick={() => ctrl.copyText('Share URL', ctrl.shareUrl())}>
          Copy share URL
        </button>
        <button type="button" style={btn} onClick={() => ctrl.copyText('CSS', ctrl.css)}>
          Copy CSS
        </button>
        <button type="button" style={btn} onClick={() => ctrl.copyText('@theme', ctrl.themeCss)}>
          Copy @theme
        </button>
        <button
          type="button"
          style={btn}
          onClick={() => ctrl.copyText('Install command', ctrl.installCmd)}
        >
          Copy install command
        </button>
      </div>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--shell-muted)', lineHeight: 1.45 }}>
        Install adds the generated theme CSS via{' '}
        <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>/r/t/…/theme</code>
        . UI components: configure <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>@cmplt</code> separately.
      </p>
      {ctrl.copyStatus ? (
        <p
          role="status"
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--shell-accent)',
          }}
        >
          {ctrl.copyStatus}
        </p>
      ) : null}
    </section>
  )
}

const section: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
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

const btn: CSSProperties = {
  border: '1px solid var(--shell-border)',
  background: 'var(--shell-panel)',
  color: 'var(--shell-fg)',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 13,
  fontWeight: 560,
  cursor: 'pointer',
}
