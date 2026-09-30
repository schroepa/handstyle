import {
  decodeThemeSpec,
  deriveTheme,
  type ResolvedTheme,
  type ThemeSpec,
} from '@handstyle/tokens'

const MAX_SPEC_LEN = 12_000

export function resolveThemeFromSpecParam(
  specParam: string,
): { spec: ThemeSpec; theme: ResolvedTheme } | null {
  if (!specParam || specParam.length > MAX_SPEC_LEN) return null
  let token = specParam
  try {
    token = decodeURIComponent(specParam)
  } catch {
    // keep raw
  }
  const spec = decodeThemeSpec(token)
  if (!spec) return null
  return { spec, theme: deriveTheme(spec) }
}

export function jsonRegistryResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'public, max-age=60',
    },
  })
}

export function optionsRegistryResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
