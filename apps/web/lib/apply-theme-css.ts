import type { ResolvedTheme } from '@handstyle/tokens'
import { serializeCss } from '@handstyle/tokens'

const STYLE_ID = 'handstyle-theme-vars'

/**
 * Inject serializeCss output into the document.
 * Rewrites :root → .hs-preview and .dark → .hs-preview.dark so shell UI stays untouched.
 */
export function applyThemeCss(theme: ResolvedTheme): void {
  if (typeof document === 'undefined') return

  let css = serializeCss(theme)
  css = css
    .replace(/:root\s*\{/g, '.hs-preview {')
    .replace(/\.dark\s*\{/g, '.hs-preview.dark {')

  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = STYLE_ID
    document.head.appendChild(el)
  }
  el.textContent = css
}
