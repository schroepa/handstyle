import { contrastRatio } from '@tintfield/engine'
import type { ResolvedTheme, ThemeMode } from '../derive'
import type { SemanticTokenName } from '../theme-spec'

export type AuditLevel = 'error' | 'warning' | 'info'

export type AuditFinding = {
  id: string
  level: AuditLevel
  mode: ThemeMode | 'both'
  message: string
  /** WCAG contrast ratio when applicable */
  ratio?: number
  /** Minimum required for AA */
  min?: number
}

const AA_NORMAL = 4.5
const AA_UI = 3

function pair(
  theme: ResolvedTheme,
  mode: ThemeMode,
  fg: SemanticTokenName,
  bg: SemanticTokenName,
  min: number,
  id: string,
  label: string,
): AuditFinding | null {
  const ratio = contrastRatio(theme.semantic[mode][fg], theme.semantic[mode][bg])
  if (ratio >= min) return null
  return {
    id: `${id}-${mode}`,
    level: 'warning',
    mode,
    message: `${label}: ${fg} on ${bg} is ${ratio.toFixed(2)}:1 (need ${min}:1) in ${mode}`,
    ratio,
    min,
  }
}

/**
 * WCAG 2.2 AA contrast audit.
 * Priority (Phase 2): --fg-muted on surfaces; hover accent (--bg-subtle) on --bg-surface.
 */
export function auditContrast(theme: ResolvedTheme): AuditFinding[] {
  const findings: AuditFinding[] = []
  const modes: ThemeMode[] = ['light', 'dark']

  for (const mode of modes) {
    // Priority 1: fg-muted on key surfaces
    for (const bg of ['bg-canvas', 'bg-surface', 'bg-elevated', 'bg-muted'] as const) {
      const f = pair(
        theme,
        mode,
        'fg-muted',
        bg,
        AA_NORMAL,
        `fg-muted-on-${bg}`,
        'Muted text',
      )
      if (f) findings.push(f)
    }

    // Priority 2: hover surface — accent-foreground on accent (= bg-subtle) sitting on surface
    // Text on hover chip
    const hoverText = pair(
      theme,
      mode,
      'fg-primary',
      'bg-subtle',
      AA_NORMAL,
      'hover-fg-on-subtle',
      'Hover surface text',
    )
    if (hoverText) findings.push(hoverText)

    // Subtle vs surface distinguishability (UI chrome, 3:1)
    const subtleOnSurface = contrastRatio(
      theme.semantic[mode]['bg-subtle'],
      theme.semantic[mode]['bg-surface'],
    )
    if (subtleOnSurface < AA_UI && subtleOnSurface > 1.01) {
      // low contrast between adjacent surfaces is often intentional; info only if very close
    }
    if (subtleOnSurface < 1.15) {
      findings.push({
        id: `hover-subtle-vs-surface-${mode}`,
        level: 'warning',
        mode,
        message: `Hover (--bg-subtle) barely differs from --bg-surface in ${mode} (${subtleOnSurface.toFixed(2)}:1)`,
        ratio: subtleOnSurface,
        min: 1.15,
      })
    }

    // Brand CTA text
    const brandFg = pair(
      theme,
      mode,
      'fg-on-brand',
      'bg-brand',
      AA_NORMAL,
      'fg-on-brand',
      'Brand CTA',
    )
    if (brandFg) findings.push(brandFg)

    // Primary body text
    const body = pair(
      theme,
      mode,
      'fg-primary',
      'bg-canvas',
      AA_NORMAL,
      'fg-primary-canvas',
      'Body text',
    )
    if (body) findings.push(body)
  }

  // Brand ↔ Feedback confusion (ΔE-ish via contrast between brand-500 and success-500 etc.)
  for (const kind of ['success', 'warning', 'danger', 'info'] as const) {
    const brand = theme.primitives.brand?.[500]?.hex
    const fb = theme.primitives[kind]?.[500]?.hex
    if (!brand || !fb) continue
    const ratio = contrastRatio(brand, fb)
    // Same-ish lightness + low contrast between solid colors → confusion risk
    if (ratio < 1.4) {
      findings.push({
        id: `brand-feedback-confusion-${kind}`,
        level: 'warning',
        mode: 'both',
        message: `Brand and ${kind} may be hard to tell apart (contrast ${ratio.toFixed(2)}:1). ${
          theme.exampleFeedbackUsed.includes(kind)
            ? 'Example feedback hue in use.'
            : ''
        }`.trim(),
        ratio,
        min: 1.4,
      })
    }
  }

  if (theme.exampleFeedbackUsed.length > 0) {
    findings.push({
      id: 'example-feedback-hues',
      level: 'info',
      mode: 'both',
      message: `Example feedback hues used for: ${theme.exampleFeedbackUsed.join(', ')}. Replace with brand feedback colors when ready.`,
    })
  }

  return findings
}

export function auditPassesAa(findings: AuditFinding[]): boolean {
  return !findings.some((f) => f.level === 'error' || f.level === 'warning')
}
