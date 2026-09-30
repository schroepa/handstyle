'use client'

import type { CSSProperties } from 'react'
import { CANONICAL_STEPS } from '@handstyle/tokens'
import type { ThemeSpecController } from '@/lib/use-theme-spec'

export function ScaleRows({ ctrl }: { ctrl: ThemeSpecController }) {
  const { theme, spec } = ctrl

  return (
    <section style={section}>
      <h2 style={heading}>Scales</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {Object.entries(theme.primitives).map(([name, scale]) => {
          const meta = spec.scales.find((s) => s.name === name)
          return (
            <div key={name}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{name}</div>
                  <div style={{ fontSize: 11, color: 'var(--shell-muted)' }}>
                    {meta?.role ?? (name === 'neutral' ? 'neutral' : 'scale')}
                    {meta?.feedbackKind ? ` · ${meta.feedbackKind}` : ''}
                  </div>
                </div>
                {meta ? (
                  <input
                    type="color"
                    value={meta.baseColor.toLowerCase()}
                    onChange={(e) => ctrl.setScaleColor(name, e.target.value.toUpperCase())}
                    aria-label={`${name} base color`}
                    style={{
                      width: 36,
                      height: 28,
                      padding: 0,
                      border: '1px solid var(--shell-border)',
                      borderRadius: 6,
                      background: 'transparent',
                      cursor: 'pointer',
                    }}
                  />
                ) : null}
              </div>
              <div style={{ display: 'flex', gap: 2, overflow: 'hidden', borderRadius: 8 }}>
                {CANONICAL_STEPS.map((step) => {
                  const color = scale[step]
                  if (!color) return null
                  return (
                    <div
                      key={step}
                      title={`${name}-${step}: ${color.hex}`}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        height: 28,
                        background: color.hex,
                      }}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      {theme.exampleFeedbackUsed.length > 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--shell-muted)' }}>
          Example feedback hues used: {theme.exampleFeedbackUsed.join(', ')}
        </p>
      ) : null}
    </section>
  )
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
