import { z } from 'zod'
import { CANONICAL_STEPS, type CanonicalStep } from './canonical'

const CanonicalStepSchema = z.union([
  z.literal(0),
  z.literal(25),
  z.literal(50),
  z.literal(100),
  z.literal(200),
  z.literal(300),
  z.literal(400),
  z.literal(500),
  z.literal(600),
  z.literal(700),
  z.literal(750),
  z.literal(800),
  z.literal(850),
  z.literal(900),
  z.literal(950),
])

/** brand-500, neutral-25, success-600, … */
export const StepRefSchema = z
  .string()
  .regex(/^[a-z][a-z0-9]*-(?:0|25|50|100|200|300|400|500|600|700|750|800|850|900|950)$/)

export type StepRef = z.infer<typeof StepRefSchema>

export const SEMANTIC_TOKEN_NAMES = [
  'bg-canvas',
  'bg-surface',
  'bg-elevated',
  'bg-subtle',
  'bg-muted',
  'fg-primary',
  'fg-secondary',
  'fg-muted',
  'border-subtle',
  'border-default',
  'border-strong',
  'bg-brand',
  'bg-brand-hover',
  'bg-brand-subtle',
  'fg-on-brand',
  'fg-brand',
  'border-brand',
  'ring-focus',
  'status-success',
  'status-success-bg',
  'status-warning',
  'status-warning-bg',
  'status-danger',
  'status-danger-bg',
  'status-info',
  'status-info-bg',
  'data-1',
  'data-2',
  'data-3',
  'data-4',
  'data-5',
] as const

export type SemanticTokenName = (typeof SEMANTIC_TOKEN_NAMES)[number]

const SemanticTokenNameSchema = z.enum(SEMANTIC_TOKEN_NAMES)

export const GenerationSettingsSchema = z.object({
  lightSteps: z.number().int().min(1).max(16),
  darkSteps: z.number().int().min(1).max(16),
  presetId: z.string().min(1),
  chromaMode: z.enum(['saturated', 'fade', 'pale']).optional(),
})

export type GenerationSettings = z.infer<typeof GenerationSettingsSchema>

export const NeutralModeSchema = z.enum(['tinted', 'warm', 'cool', 'custom'])
export type NeutralMode = z.infer<typeof NeutralModeSchema>

export const ScaleRoleSchema = z.enum(['brand', 'feedback'])
export type ScaleRole = z.infer<typeof ScaleRoleSchema>

export const FeedbackKindSchema = z.enum(['success', 'warning', 'danger', 'info'])
export type FeedbackKind = z.infer<typeof FeedbackKindSchema>

const HexColorSchema = z
  .string()
  .regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/, 'Expected #RGB or #RRGGBB')

export const ThemeScaleSchema = z
  .object({
    name: z
      .string()
      .regex(/^[a-z][a-z0-9-]*$/, 'Scale name must be a lowercase slug'),
    baseColor: HexColorSchema,
    role: ScaleRoleSchema,
    feedbackKind: FeedbackKindSchema.optional(),
    baseOverride: z.string().nullable().optional(),
  })
  .superRefine((scale, ctx) => {
    if (scale.role === 'feedback' && !scale.feedbackKind) {
      ctx.addIssue({
        code: 'custom',
        message: 'feedback scales require feedbackKind',
        path: ['feedbackKind'],
      })
    }
  })

export const ThemeSpecSchema = z
  .object({
    v: z.literal(1),
    name: z.string().min(1),
    generation: GenerationSettingsSchema,
    scales: z.array(ThemeScaleSchema).min(1),
    neutral: z.object({
      mode: NeutralModeSchema,
      baseColor: HexColorSchema.optional(),
    }),
    semanticMap: z
      .record(
        SemanticTokenNameSchema,
        z.object({
          light: StepRefSchema,
          dark: StepRefSchema,
        }),
      )
      .optional(),
    radius: z.enum(['none', 'sm', 'md', 'lg', 'xl']).optional(),
    density: z.enum(['compact', 'default', 'comfortable']).optional(),
  })
  .superRefine((spec, ctx) => {
    if (spec.neutral.mode === 'custom' && !spec.neutral.baseColor) {
      ctx.addIssue({
        code: 'custom',
        message: 'neutral.mode "custom" requires neutral.baseColor',
        path: ['neutral', 'baseColor'],
      })
    }
    const brands = spec.scales.filter((s) => s.role === 'brand')
    if (brands.length < 1) {
      ctx.addIssue({
        code: 'custom',
        message: 'At least one scale with role "brand" is required',
        path: ['scales'],
      })
    }
  })

export type ThemeSpec = z.infer<typeof ThemeSpecSchema>

export function parseThemeSpec(input: unknown): ThemeSpec {
  return ThemeSpecSchema.parse(input)
}

export function safeParseThemeSpec(input: unknown) {
  return ThemeSpecSchema.safeParse(input)
}

/** Encode ThemeSpec as base64url (isomorph, no window). */
export function encodeThemeSpec(spec: ThemeSpec): string {
  const json = JSON.stringify(spec)
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeThemeSpec(token: string): ThemeSpec | null {
  try {
    const padded = token.replace(/-/g, '+').replace(/_/g, '/')
    const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
    const binary = atob(padded + pad)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    const json = new TextDecoder().decode(bytes)
    return parseThemeSpec(JSON.parse(json))
  } catch {
    return null
  }
}

export { CANONICAL_STEPS, type CanonicalStep }
