import type { CanonicalStep } from './canonical'
import { stepRef } from './canonical'
import type { SemanticTokenName } from './theme-spec'

export type ModeMapping = { light: string; dark: string }

/** Default Semantic → Primitive-Step (nur kanonische Stufen). */
export const DEFAULT_SEMANTIC_MAP: Record<SemanticTokenName, ModeMapping> = {
  'bg-canvas': { light: 'neutral-100', dark: 'neutral-950' },
  'bg-surface': { light: 'neutral-25', dark: 'neutral-900' },
  'bg-elevated': { light: 'neutral-0', dark: 'neutral-800' },
  'bg-subtle': { light: 'neutral-50', dark: 'neutral-850' },
  'bg-muted': { light: 'neutral-200', dark: 'neutral-750' },
  'fg-primary': { light: 'neutral-950', dark: 'neutral-100' },
  'fg-secondary': { light: 'neutral-600', dark: 'neutral-400' },
  'fg-muted': { light: 'neutral-500', dark: 'neutral-500' },
  'border-subtle': { light: 'neutral-200', dark: 'neutral-750' },
  'border-default': { light: 'neutral-300', dark: 'neutral-700' },
  'border-strong': { light: 'neutral-400', dark: 'neutral-600' },

  'bg-brand': { light: 'brand-500', dark: 'brand-500' },
  'bg-brand-hover': { light: 'brand-600', dark: 'brand-400' },
  'bg-brand-subtle': { light: 'brand-50', dark: 'brand-900' },
  'fg-on-brand': { light: 'neutral-0', dark: 'neutral-0' },
  'fg-brand': { light: 'brand-500', dark: 'brand-400' },
  'border-brand': { light: 'brand-400', dark: 'brand-400' },
  'ring-focus': { light: 'brand-500', dark: 'brand-400' },

  'status-success': { light: 'success-500', dark: 'success-400' },
  'status-success-bg': { light: 'success-50', dark: 'success-900' },
  'status-warning': { light: 'warning-600', dark: 'warning-400' },
  'status-warning-bg': { light: 'warning-50', dark: 'warning-900' },
  'status-danger': { light: 'danger-600', dark: 'danger-400' },
  'status-danger-bg': { light: 'danger-50', dark: 'danger-900' },
  'status-info': { light: 'info-500', dark: 'info-400' },
  'status-info-bg': { light: 'info-50', dark: 'info-900' },

  'data-1': { light: 'brand-500', dark: 'brand-400' },
  'data-2': { light: 'success-500', dark: 'success-400' },
  'data-3': { light: 'warning-500', dark: 'warning-400' },
  'data-4': { light: 'danger-500', dark: 'danger-400' },
  'data-5': { light: 'info-500', dark: 'info-400' },
}

/** shadcn CSS vars → Handstyle semantic (Ausgabe, nie Quelle). */
export const SHADCN_ALIAS_MAP: Record<string, string> = {
  background: 'bg-canvas',
  foreground: 'fg-primary',
  card: 'bg-surface',
  'card-foreground': 'fg-primary',
  popover: 'bg-elevated',
  'popover-foreground': 'fg-primary',
  primary: 'bg-brand',
  'primary-foreground': 'fg-on-brand',
  secondary: 'bg-muted',
  'secondary-foreground': 'fg-primary',
  muted: 'bg-muted',
  'muted-foreground': 'fg-muted',
  /** Hover-Fläche — nicht Marke */
  accent: 'bg-subtle',
  'accent-foreground': 'fg-primary',
  destructive: 'status-danger',
  border: 'border-default',
  input: 'border-default',
  ring: 'ring-focus',
  'chart-1': 'data-1',
  'chart-2': 'data-2',
  'chart-3': 'data-3',
  'chart-4': 'data-4',
  'chart-5': 'data-5',
  sidebar: 'bg-subtle',
  'sidebar-foreground': 'fg-primary',
  'sidebar-primary': 'bg-brand',
  'sidebar-primary-foreground': 'fg-on-brand',
  'sidebar-accent': 'bg-muted',
  'sidebar-accent-foreground': 'fg-primary',
  'sidebar-border': 'border-subtle',
  'sidebar-ring': 'ring-focus',
}

export const RADIUS_VALUES: Record<
  'none' | 'sm' | 'md' | 'lg' | 'xl',
  string
> = {
  none: '0rem',
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.625rem',
  xl: '0.75rem',
}

export function defaultMapFor(
  token: SemanticTokenName,
): ModeMapping {
  return DEFAULT_SEMANTIC_MAP[token]
}

export function brandSubtleStep(mode: 'light' | 'dark'): CanonicalStep {
  return mode === 'light' ? 50 : 900
}

export { stepRef }
