import { ImageResponse } from 'next/og'
import { CANONICAL_STEPS } from '@handstyle/tokens'
import { resolveThemeFromSpecParam } from '@/lib/resolve-theme-spec'

export const alt = 'Handstyle theme preview'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

type RouteParams = { params: Promise<{ spec: string }> }

export default async function Image({ params }: RouteParams) {
  const { spec: specParam } = await params
  const resolved = resolveThemeFromSpecParam(specParam)

  const name = resolved?.spec.name ?? 'Handstyle'
  const brand = resolved?.theme.primitives.brand
  const brandHex = brand?.[500]?.hex ?? '#0D7377'
  const steps = ([50, 200, 400, 500, 700, 900] as const)
    .map((s) => brand?.[s]?.hex)
    .filter(Boolean) as string[]

  const canvas = resolved?.theme.semantic.light['bg-canvas'] ?? '#f4f4f2'
  const fg = resolved?.theme.semantic.light['fg-primary'] ?? '#1a1a1a'
  const muted = resolved?.theme.semantic.light['fg-muted'] ?? '#6b6b6b'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          background: canvas,
          color: fg,
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 28,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: muted,
              fontWeight: 600,
            }}
          >
            Handstyle
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: '-0.04em',
            }}
          >
            {name}
          </div>
          <div style={{ display: 'flex', fontSize: 28, color: muted }}>
            Theme · {brandHex}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              width: 120,
              height: 120,
              borderRadius: 24,
              background: brandHex,
            }}
          />
          <div style={{ display: 'flex', gap: 8, flex: 1 }}>
            {steps.map((hex) => (
              <div
                key={hex}
                style={{
                  display: 'flex',
                  flex: 1,
                  height: 72,
                  borderRadius: 12,
                  background: hex,
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: 20, color: muted }}>
          {CANONICAL_STEPS.length} canonical steps · light + dark
        </div>
      </div>
    ),
    { ...size },
  )
}
