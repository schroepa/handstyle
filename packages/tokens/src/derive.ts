import {
  converter,
  formatHex,
  parse,
  type Oklch,
} from 'culori'
import {
  generateFromPreset,
  getBuiltinPreset,
  onColor,
  settingsFromPreset,
  type ChromaMode,
  type Preset,
} from '@tintfield/engine'
import {
  CANONICAL_L,
  CANONICAL_STEPS,
  parseStepRef,
  type CanonicalStep,
} from './canonical'
import {
  DEFAULT_SEMANTIC_MAP,
  RADIUS_VALUES,
  SHADCN_ALIAS_MAP,
} from './semantic-map'
import type {
  FeedbackKind,
  SemanticTokenName,
  ThemeSpec,
} from './theme-spec'
import { SEMANTIC_TOKEN_NAMES } from './theme-spec'

const toOklch = converter('oklch')

export type PrimitiveColor = {
  hex: string
  oklch: [number, number, number]
}

export type PrimitiveScale = Record<CanonicalStep, PrimitiveColor>

export type ThemeMode = 'light' | 'dark'

export type ResolvedTheme = {
  spec: ThemeSpec
  primitives: Record<string, PrimitiveScale>
  /** Semantic token → resolved hex per mode (aliases already resolved) */
  semantic: Record<ThemeMode, Record<SemanticTokenName, string>>
  /** Semantic → step ref used (after overrides) */
  semanticRefs: Record<ThemeMode, Record<SemanticTokenName, string>>
  shadcn: Record<ThemeMode, Record<string, string>>
  radius: string
  /** Example feedback hues used when user omitted feedback scales */
  exampleFeedbackUsed: FeedbackKind[]
}

/** Beispiel-Hue-Familien (klar als Fallback gelabelt). */
export const EXAMPLE_FEEDBACK_HUES: Record<FeedbackKind, { hex: string; label: string }> = {
  success: { hex: '#2F9E6B', label: 'Beispiel Grün' },
  warning: { hex: '#C47A00', label: 'Beispiel Bernstein' },
  danger: { hex: '#D14343', label: 'Beispiel Rot' },
  info: { hex: '#3B6AE0', label: 'Beispiel Blau' },
}

const FEEDBACK_KINDS: FeedbackKind[] = ['success', 'warning', 'danger', 'info']

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n))
}

function oklchTuple(color: Oklch | undefined): [number, number, number] {
  return [color?.l ?? 0, color?.c ?? 0, color?.h ?? 0]
}

function fromOklch(l: number, c: number, h: number): PrimitiveColor {
  const hex =
    formatHex({ mode: 'oklch', l: clamp01(l), c: Math.max(0, c), h }) ?? '#000000'
  const o = toOklch(parse(hex)!)
  return { hex, oklch: oklchTuple(o) }
}

/**
 * Interpoliert eine Engine-Ramp auf kanonische Stufen (nach Relativposition / L).
 */
export function normalizeRampToCanonical(
  steps: { hex: string; oklch: [number, number, number] }[],
): PrimitiveScale {
  if (steps.length === 0) {
    throw new Error('Cannot normalize empty ramp')
  }
  const sorted = [...steps].sort((a, b) => b.oklch[0] - a.oklch[0]) // light → dark
  const out = {} as PrimitiveScale

  for (let i = 0; i < CANONICAL_STEPS.length; i++) {
    const step = CANONICAL_STEPS[i]!
    const last = CANONICAL_STEPS.length - 1
    const t = last === 0 ? 0 : i / last
    const pos = t * (sorted.length - 1)
    const lo = Math.floor(pos)
    const hi = Math.min(sorted.length - 1, lo + 1)
    const f = pos - lo
    const a = sorted[lo]!
    const b = sorted[hi]!
    const l = a.oklch[0] + (b.oklch[0] - a.oklch[0]) * f
    const c = a.oklch[1] + (b.oklch[1] - a.oklch[1]) * f
    let h = a.oklch[2]
    const hb = b.oklch[2]
    let dh = hb - h
    if (dh > 180) dh -= 360
    if (dh < -180) dh += 360
    h = h + dh * f
    out[step] = fromOklch(l, c, h)
  }
  return out
}

function resolvePreset(spec: ThemeSpec): Preset {
  const id = spec.generation.presetId
  const builtin = getBuiltinPreset(id === 'compact' ? 'open-color' : id)
  if (builtin) return builtin
  // compact / unknown → densify via fine-50 for richer interpolation source
  return getBuiltinPreset('fine-50') ?? getBuiltinPreset('tailwind')!
}

function generateChromaticScale(
  baseHex: string,
  spec: ThemeSpec,
  chromaMode?: ChromaMode,
): PrimitiveScale {
  const preset = resolvePreset(spec)
  const mode = chromaMode ?? spec.generation.chromaMode ?? 'saturated'
  const result = generateFromPreset({
    baseHex,
    preset,
    chromaMode: mode,
    baseOverride: null,
    theme: 'light',
  })
  return normalizeRampToCanonical(
    result.steps.map((s) => ({ hex: s.hex, oklch: s.oklch })),
  )
}

function neutralBaseHex(spec: ThemeSpec, brandHex: string): string {
  const brand = toOklch(parse(brandHex)!)
  const h = brand?.h ?? 85
  switch (spec.neutral.mode) {
    case 'warm':
      return formatHex({ mode: 'oklch', l: 0.635, c: 0.004, h: 85 }) ?? '#8B8B88'
    case 'cool':
      return formatHex({ mode: 'oklch', l: 0.635, c: 0.008, h: 250 }) ?? '#858892'
    case 'custom':
      return spec.neutral.baseColor ?? brandHex
    case 'tinted':
    default:
      return (
        formatHex({
          mode: 'oklch',
          l: 0.635,
          c: Math.min(0.02, (brand?.c ?? 0) * 0.15),
          h,
        }) ?? brandHex
      )
  }
}

/** Neutral aus fester L-Leiter + Hue/Chroma der Basis. */
export function buildNeutralScale(baseHex: string): PrimitiveScale {
  const base = toOklch(parse(baseHex)!)
  const h = base?.h ?? 85
  const c = Math.min(0.02, Math.max(0.002, (base?.c ?? 0.004)))
  const out = {} as PrimitiveScale
  for (const step of CANONICAL_STEPS) {
    // Chroma drops slightly toward poles
    const t = CANONICAL_L[step]
    const chroma = c * (0.4 + 0.6 * (1 - Math.abs(t - 0.6) / 0.6))
    out[step] = fromOklch(CANONICAL_L[step], chroma, h)
  }
  return out
}

function resolvePrimitive(
  primitives: Record<string, PrimitiveScale>,
  ref: string,
): PrimitiveColor {
  const parsed = parseStepRef(ref)
  if (!parsed) throw new Error(`Invalid step ref: ${ref}`)
  const scale = primitives[parsed.scale]
  if (!scale) throw new Error(`Unknown scale in ref: ${ref}`)
  const color = scale[parsed.step]
  if (!color) throw new Error(`Missing step in ref: ${ref}`)
  return color
}

function pickFgOnBrand(bgHex: string): string {
  return onColor(bgHex)
}

/**
 * Leitet Primitive + Semantic + shadcn-Aliase aus einer ThemeSpec ab.
 */
export function deriveTheme(spec: ThemeSpec): ResolvedTheme {
  const brandScale = spec.scales.find((s) => s.role === 'brand')
  if (!brandScale) throw new Error('ThemeSpec requires a brand scale')

  const primitives: Record<string, PrimitiveScale> = {}

  // Brand (and any extra brand-named scales)
  for (const scale of spec.scales.filter((s) => s.role === 'brand')) {
    const slug = scale.name === 'brand' || scale.role === 'brand' ? (scale.name === brandScale.name ? 'brand' : scale.name) : scale.name
    // Primary brand always registered as "brand"
    if (scale === brandScale) {
      primitives.brand = generateChromaticScale(scale.baseColor, spec)
    } else {
      primitives[slug] = generateChromaticScale(scale.baseColor, spec)
    }
  }
  if (!primitives.brand) {
    primitives.brand = generateChromaticScale(brandScale.baseColor, spec)
  }

  // Neutral
  const nBase = neutralBaseHex(spec, brandScale.baseColor)
  primitives.neutral = buildNeutralScale(nBase)

  // Feedback — user scales or example hues
  const exampleFeedbackUsed: FeedbackKind[] = []
  for (const kind of FEEDBACK_KINDS) {
    const user = spec.scales.find(
      (s) => s.role === 'feedback' && s.feedbackKind === kind,
    )
    if (user) {
      primitives[kind] = generateChromaticScale(user.baseColor, spec)
    } else {
      exampleFeedbackUsed.push(kind)
      primitives[kind] = generateChromaticScale(
        EXAMPLE_FEEDBACK_HUES[kind].hex,
        spec,
        'fade',
      )
    }
  }

  // Semantic refs + resolved colors
  const semanticRefs = {
    light: {} as Record<SemanticTokenName, string>,
    dark: {} as Record<SemanticTokenName, string>,
  }
  const semantic = {
    light: {} as Record<SemanticTokenName, string>,
    dark: {} as Record<SemanticTokenName, string>,
  }

  for (const token of SEMANTIC_TOKEN_NAMES) {
    const override = spec.semanticMap?.[token]
    const def = DEFAULT_SEMANTIC_MAP[token]
    const lightRef = override?.light ?? def.light
    const darkRef = override?.dark ?? def.dark
    semanticRefs.light[token] = lightRef
    semanticRefs.dark[token] = darkRef

    if (token === 'fg-on-brand') {
      // Computed for AA on the brand fill; mapping refs are documentation only.
      semantic.light[token] = pickFgOnBrand(
        resolvePrimitive(primitives, semanticRefs.light['bg-brand']).hex,
      )
      semantic.dark[token] = pickFgOnBrand(
        resolvePrimitive(primitives, semanticRefs.dark['bg-brand']).hex,
      )
    } else {
      semantic.light[token] = resolvePrimitive(primitives, lightRef).hex
      semantic.dark[token] = resolvePrimitive(primitives, darkRef).hex
    }
  }

  const shadcn = {
    light: {} as Record<string, string>,
    dark: {} as Record<string, string>,
  }
  for (const [shadcnName, semanticName] of Object.entries(SHADCN_ALIAS_MAP)) {
    const key = semanticName as SemanticTokenName
    shadcn.light[shadcnName] = semantic.light[key]
    shadcn.dark[shadcnName] = semantic.dark[key]
  }

  const radiusKey = spec.radius ?? 'md'

  return {
    spec,
    primitives,
    semantic,
    semanticRefs,
    shadcn,
    radius: RADIUS_VALUES[radiusKey],
    exampleFeedbackUsed,
  }
}

/** Convenience: settings aligned with engine preset. */
export function generationFromPresetId(presetId: string) {
  const preset = getBuiltinPreset(presetId) ?? getBuiltinPreset('tailwind')!
  return { ...settingsFromPreset(preset), presetId: preset.id, chromaMode: 'saturated' as const }
}
