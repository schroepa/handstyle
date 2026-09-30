'use client'

import type { CSSProperties } from 'react'
import type { ThemeSpecController } from '@/lib/use-theme-spec'

export function ContrastPanel({ ctrl }: { ctrl: ThemeSpecController }) {
  const { findings } = ctrl
  const errors = findings.filter((f) => f.level === 'error')
  const warnings = findings.filter((f) => f.level === 'warning')
  const infos = findings.filter((f) => f.level === 'info')
  const pass = findings.length === 0

  return (
    <section style={section}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 style={heading}>Contrast</h2>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: pass ? '#1f7a4d' : warnings.length || errors.length ? '#a15c00' : 'var(--shell-muted)',
          }}
        >
          {pass ? 'AA checks clear' : `${findings.length} finding${findings.length === 1 ? '' : 's'}`}
        </span>
      </div>

      {pass ? (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--shell-muted)' }}>
          Priority pairs (fg-muted on surfaces, hover subtle) pass AA thresholds.
        </p>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...errors, ...warnings, ...infos].map((f) => (
            <li key={f.id} style={{ fontSize: 12, lineHeight: 1.4 }}>
              <strong style={{ textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.04em' }}>
                {f.level}
              </strong>{' '}
              <span style={{ color: 'var(--shell-muted)' }}>[{f.mode}]</span> {f.message}
              {f.ratio != null && f.min != null ? (
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--shell-muted)' }}>
                  {' '}
                  ({f.ratio.toFixed(2)} / {f.min})
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
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
