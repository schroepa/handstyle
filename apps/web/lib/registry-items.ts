import {
  SHADCN_ALIAS_MAP,
  serializeCss,
  serializeTailwindV4,
  type ResolvedTheme,
  type SemanticTokenName,
  type ThemeMode,
} from '@handstyle/tokens'


export type RegistryFile = {
  path: string
  content: string
  type: 'registry:style' | 'registry:file'
  target: string
}

export type RegistryItem = {
  $schema: string
  name: string
  type: 'registry:style' | 'registry:theme'
  title: string
  description: string
  dependencies: string[]
  registryDependencies: string[]
  files?: RegistryFile[]
  cssVars?: {
    light: Record<string, string>
    dark: Record<string, string>
  }
}

function shadcnCssVars(theme: ResolvedTheme): {
  light: Record<string, string>
  dark: Record<string, string>
} {
  const build = (mode: ThemeMode): Record<string, string> => {
    const out: Record<string, string> = {}
    for (const [shadcnName, semanticName] of Object.entries(SHADCN_ALIAS_MAP)) {
      const hex = theme.semantic[mode][semanticName as SemanticTokenName]
      if (typeof hex === 'string') out[shadcnName] = hex
    }
    out.radius = theme.radius
    return out
  }
  return { light: build('light'), dark: build('dark') }
}

/** Combined CSS: Tailwind v4 @theme + :root/.dark vars (includes shadcn aliases). */
export function buildThemeCss(theme: ResolvedTheme): string {
  return serializeTailwindV4(theme)
}

export function buildTokensCss(theme: ResolvedTheme): string {
  return serializeCss(theme)
}

/**
 * Primary install target for `npx shadcn add …/theme`.
 * Uses registry:style + file injection (reliable CLI path) and cssVars for theme tooling.
 */
export function buildThemeRegistryItem(theme: ResolvedTheme): RegistryItem {
  const css = buildThemeCss(theme)
  return {
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name: 'theme',
    type: 'registry:style',
    title: `${theme.spec.name} — Handstyle Theme`,
    description:
      'Generated Handstyle theme: semantic + primitive OKLCH tokens, shadcn aliases, and Tailwind v4 @theme.',
    dependencies: [],
    registryDependencies: [],
    cssVars: shadcnCssVars(theme),
    files: [
      {
        path: 'styles/handstyle-theme.css',
        content: css,
        type: 'registry:style',
        target: 'styles/handstyle-theme.css',
      },
    ],
  }
}

/** Tokens-only CSS (no @theme block duplication beyond serializeCss). */
export function buildTokensRegistryItem(theme: ResolvedTheme): RegistryItem {
  return {
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name: 'tokens',
    type: 'registry:style',
    title: `${theme.spec.name} — Handstyle Tokens`,
    description: 'Generated Handstyle CSS custom properties (light + dark).',
    dependencies: [],
    registryDependencies: [],
    files: [
      {
        path: 'styles/handstyle-tokens.css',
        content: buildTokensCss(theme),
        type: 'registry:style',
        target: 'styles/handstyle-tokens.css',
      },
    ],
  }
}

export function buildRegistryIndex(specToken: string, baseUrl: string) {
  const root = baseUrl.replace(/\/$/, '')
  return {
    $schema: 'https://ui.shadcn.com/schema/registry.json',
    name: 'handstyle',
    homepage: root,
    items: [
      {
        name: 'theme',
        type: 'registry:style',
        title: 'Handstyle Theme',
        description: 'Theme CSS + @theme for a ThemeSpec',
        registryDependencies: [],
        files: [{ path: `${root}/r/t/${specToken}/theme` }],
      },
      {
        name: 'tokens',
        type: 'registry:style',
        title: 'Handstyle Tokens',
        description: 'CSS custom properties only',
        registryDependencies: [],
        files: [{ path: `${root}/r/t/${specToken}/tokens` }],
      },
    ],
  }
}
