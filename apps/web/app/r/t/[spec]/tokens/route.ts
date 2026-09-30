import {
  jsonRegistryResponse,
  optionsRegistryResponse,
  resolveThemeFromSpecParam,
} from '@/lib/resolve-theme-spec'
import { buildTokensRegistryItem } from '@/lib/registry-items'

type RouteParams = { params: Promise<{ spec: string }> }

export async function OPTIONS() {
  return optionsRegistryResponse()
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { spec } = await params
  const resolved = resolveThemeFromSpecParam(spec)
  if (!resolved) {
    return jsonRegistryResponse(
      { error: 'Invalid or oversized ThemeSpec token' },
      400,
    )
  }
  return jsonRegistryResponse(buildTokensRegistryItem(resolved.theme))
}
