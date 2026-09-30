import type { ResolvedTheme } from '@handstyle/tokens'
import { serializeCss } from '@handstyle/tokens'

/**
 * Scope generated theme CSS to the live preview root.
 * :root → .hs-preview, .dark → .hs-preview.dark
 */
export function scopeThemeCss(theme: ResolvedTheme): string {
  return serializeCss(theme)
    .replace(/:root\s*\{/g, '.hs-preview {')
    .replace(/\.dark\s*\{/g, '.hs-preview.dark {')
}

/** @deprecated Prefer scopeThemeCss + declarative <style> */
export function applyThemeCss(theme: ResolvedTheme): void {
  if (typeof document === 'undefined') return

  const css = scopeThemeCss(theme)
  let el = document.getElementById('handstyle-theme-vars') as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = 'handstyle-theme-vars'
    document.head.appendChild(el)
  }
  el.textContent = css
}
