/** Kanonische Stufen — jede Ramp wird darauf normalisiert. */
export const CANONICAL_STEPS = [
  0, 25, 50, 100, 200, 300, 400, 500, 600, 700, 750, 800, 850, 900, 950,
] as const

export type CanonicalStep = (typeof CANONICAL_STEPS)[number]

/**
 * Feste Helligkeitsleiter (cmplt-Neutral, OKLCH L).
 * Quelle für Neutral-Primitives; Brand/Feedback nutzen Positions-Interpolation.
 */
export const CANONICAL_L: Record<CanonicalStep, number> = {
  0: 0.992,
  25: 0.985,
  50: 0.968,
  100: 0.95,
  200: 0.922,
  300: 0.882,
  400: 0.745,
  500: 0.635,
  600: 0.51,
  700: 0.36,
  750: 0.332,
  800: 0.304,
  850: 0.286,
  900: 0.27,
  950: 0.242,
}

export function isCanonicalStep(n: number): n is CanonicalStep {
  return (CANONICAL_STEPS as readonly number[]).includes(n)
}

export function parseStepRef(ref: string): { scale: string; step: CanonicalStep } | null {
  const m = /^(?<scale>[a-z][a-z0-9-]*)-(?<step>\d+)$/i.exec(ref)
  if (!m?.groups) return null
  const step = Number(m.groups.step)
  if (!isCanonicalStep(step)) return null
  return { scale: m.groups.scale!, step }
}

export function stepRef(scale: string, step: CanonicalStep): `${string}-${CanonicalStep}` {
  return `${scale}-${step}`
}
