import {
  EXAMPLE_FEEDBACK_HUES,
  generationFromPresetId,
  parseThemeSpec,
  type ThemeSpec,
} from '@handstyle/tokens'

export const PRESET_OPTIONS = [
  { id: 'tailwind', label: 'Tailwind' },
  { id: 'radix', label: 'Radix' },
  { id: 'material3', label: 'Material 3' },
  { id: 'ant', label: 'Ant' },
  { id: 'carbon', label: 'Carbon' },
  { id: 'fine-50', label: 'Fine 50' },
  { id: 'open-color', label: 'Open Color' },
] as const

export const RADIUS_OPTIONS = ['none', 'sm', 'md', 'lg', 'xl'] as const

export function createDefaultThemeSpec(): ThemeSpec {
  return parseThemeSpec({
    v: 1,
    name: 'Demo Brand',
    generation: generationFromPresetId('tailwind'),
    scales: [
      { name: 'brand', baseColor: '#0D7377', role: 'brand' },
      {
        name: 'success',
        baseColor: EXAMPLE_FEEDBACK_HUES.success.hex,
        role: 'feedback',
        feedbackKind: 'success',
      },
      {
        name: 'warning',
        baseColor: EXAMPLE_FEEDBACK_HUES.warning.hex,
        role: 'feedback',
        feedbackKind: 'warning',
      },
      {
        name: 'danger',
        baseColor: EXAMPLE_FEEDBACK_HUES.danger.hex,
        role: 'feedback',
        feedbackKind: 'danger',
      },
      {
        name: 'info',
        baseColor: EXAMPLE_FEEDBACK_HUES.info.hex,
        role: 'feedback',
        feedbackKind: 'info',
      },
    ],
    neutral: { mode: 'tinted' },
    radius: 'md',
    density: 'default',
  })
}

export function installCommandFor(specToken: string, origin?: string): string {
  const base = (origin ?? 'https://handstyle.dev').replace(/\/$/, '')
  return `npx shadcn add ${base}/r/t/${specToken}/theme`
}

