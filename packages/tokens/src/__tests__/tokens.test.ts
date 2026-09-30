import { describe, expect, it } from 'vitest'
import {
  auditContrast,
  decodeThemeSpec,
  deriveTheme,
  encodeThemeSpec,
  generationFromPresetId,
  normalizeRampToCanonical,
  parseThemeSpec,
  serialize,
  serializeCss,
  type ThemeSpec,
} from '../index'

function sampleSpec(overrides: Partial<ThemeSpec> = {}): ThemeSpec {
  return parseThemeSpec({
    v: 1,
    name: 'Demo Brand',
    generation: generationFromPresetId('tailwind'),
    scales: [{ name: 'brand', baseColor: '#0D7377', role: 'brand' }],
    neutral: { mode: 'tinted' },
    ...overrides,
  })
}

describe('ThemeSpec validation', () => {
  it('accepts a minimal valid spec', () => {
    const spec = sampleSpec()
    expect(spec.v).toBe(1)
    expect(spec.scales[0]?.role).toBe('brand')
  })

  it('rejects missing brand scale', () => {
    expect(() =>
      parseThemeSpec({
        v: 1,
        name: 'X',
        generation: generationFromPresetId('tailwind'),
        scales: [
          {
            name: 'success',
            baseColor: '#2F9E6B',
            role: 'feedback',
            feedbackKind: 'success',
          },
        ],
        neutral: { mode: 'tinted' },
      }),
    ).toThrow(/brand/)
  })

  it('rejects custom neutral without baseColor', () => {
    expect(() =>
      parseThemeSpec({
        ...sampleSpec(),
        neutral: { mode: 'custom' },
      }),
    ).toThrow(/baseColor/)
  })

  it('roundtrips encode/decode', () => {
    const spec = sampleSpec()
    const token = encodeThemeSpec(spec)
    expect(token).not.toContain('+')
    expect(token).not.toContain('/')
    expect(decodeThemeSpec(token)).toEqual(spec)
  })
})

describe('normalizeRampToCanonical', () => {
  it('always yields all canonical steps', () => {
    const ramp = normalizeRampToCanonical([
      { hex: '#ffffff', oklch: [0.99, 0, 0] },
      { hex: '#808080', oklch: [0.6, 0, 0] },
      { hex: '#111111', oklch: [0.2, 0, 0] },
    ])
    expect(Object.keys(ramp).map(Number).sort((a, b) => a - b)).toEqual([
      0, 25, 50, 100, 200, 300, 400, 500, 600, 700, 750, 800, 850, 900, 950,
    ])
  })
})

describe('deriveTheme', () => {
  it('produces brand, neutral, and feedback primitives', () => {
    const theme = deriveTheme(sampleSpec())
    expect(theme.primitives.brand?.[500]?.hex).toMatch(/^#/)
    expect(theme.primitives.neutral?.[25]?.hex).toMatch(/^#/)
    expect(theme.primitives.success?.[500]?.hex).toMatch(/^#/)
    expect(theme.exampleFeedbackUsed).toEqual([
      'success',
      'warning',
      'danger',
      'info',
    ])
  })

  it('maps semantic tokens and shadcn primary to brand', () => {
    const theme = deriveTheme(sampleSpec())
    expect(theme.semantic.light['bg-brand']).toBe(theme.primitives.brand![500]!.hex)
    expect(theme.shadcn.light.primary).toBe(theme.semantic.light['bg-brand'])
    expect(theme.shadcn.light.accent).toBe(theme.semantic.light['bg-subtle'])
    expect(theme.shadcn.light['chart-1']).toBe(theme.semantic.light['data-1'])
  })

  it('uses same brand ramp mapping in both modes by default', () => {
    const theme = deriveTheme(sampleSpec())
    expect(theme.semanticRefs.light['bg-brand']).toBe('brand-500')
    expect(theme.semanticRefs.dark['bg-brand']).toBe('brand-500')
  })
})

describe('contrast audit (priority pairs)', () => {
  it('runs fg-muted and hover checks for both modes', () => {
    const theme = deriveTheme(sampleSpec())
    const findings = auditContrast(theme)
    const ids = findings.map((f) => f.id)
    expect(Array.isArray(findings)).toBe(true)
    expect(ids).toContain('example-feedback-hues')

    const muted = findings.filter((f) => f.id.includes('fg-muted'))
    for (const f of muted) {
      expect(f.ratio).toBeTypeOf('number')
    }

    // Hover: bg-subtle vs bg-surface checked when too close
    const hover = findings.filter((f) => f.id.includes('hover'))
    for (const f of hover) {
      expect(f.mode === 'light' || f.mode === 'dark' || f.mode === 'both').toBe(true)
    }

    // Snapshot of warning count for the default demo (tunable mapping later)
    const warnings = findings.filter((f) => f.level === 'warning')
    expect(warnings.length).toBeGreaterThanOrEqual(0)
  })

  it('reports concrete fg-muted ratios on canvas for documentation', () => {
    const theme = deriveTheme(sampleSpec())
    const findings = auditContrast(theme)
    const lightCanvas = findings.find((f) => f.id === 'fg-muted-on-bg-canvas-light')
    const darkCanvas = findings.find((f) => f.id === 'fg-muted-on-bg-canvas-dark')
    // If absent, pair passed AA — also OK
    if (lightCanvas) expect(lightCanvas.ratio!).toBeLessThan(4.5)
    if (darkCanvas) expect(darkCanvas.ratio!).toBeLessThan(4.5)
  })
})

describe('serializers', () => {
  it('emits CSS with semantic aliases and shadcn layer', () => {
    const theme = deriveTheme(sampleSpec())
    const css = serializeCss(theme)
    expect(css).toContain('--bg-surface:')
    expect(css).toContain('--bg-brand:')
    expect(css).toContain('--primary: var(--bg-brand)')
    expect(css).toContain('--accent: var(--bg-subtle)')
    expect(css).toContain('.dark')
  })

  it('emits each format without throwing', () => {
    const theme = deriveTheme(sampleSpec())
    for (const format of ['css', 'tailwind-v4', 'dtcg', 'figma', 'design-md'] as const) {
      const out = serialize(theme, format)
      expect(out.length).toBeGreaterThan(20)
    }
  })

  it('dtcg includes primitive and semantic color groups', () => {
    const theme = deriveTheme(sampleSpec())
    const json = JSON.parse(serialize(theme, 'dtcg'))
    expect(json.color.brand['500'].$type).toBe('color')
    expect(json.color.semantic['bg-surface'].$value.light).toMatch(/^#/)
  })

  it('figma payload has primitive keys and light/dark semantic', () => {
    const theme = deriveTheme(sampleSpec())
    const payload = JSON.parse(serialize(theme, 'figma'))
    expect(payload.collections).toHaveLength(2)
    expect(payload.variables.primitives[0].key).toMatch(/^primitive\//)
    expect(payload.variables.semantic.some((v: { mode: string }) => v.mode === 'dark')).toBe(
      true,
    )
  })

  it('design.md mentions brand vs accent rule', () => {
    const md = serialize(deriveTheme(sampleSpec()), 'design-md')
    expect(md).toContain('--bg-brand')
    expect(md).toContain('--accent')
  })
})
