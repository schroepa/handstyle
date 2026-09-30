import {
  jsonRegistryResponse,
  optionsRegistryResponse,
  resolveThemeFromSpecParam,
} from '@/lib/resolve-theme-spec'
import { buildRegistryIndex } from '@/lib/registry-items'

type RouteParams = { params: Promise<{ spec: string }> }

export async function OPTIONS() {
  return optionsRegistryResponse()
}

export async function GET(request: Request, { params }: RouteParams) {
  const { spec } = await params
  const resolved = resolveThemeFromSpecParam(spec)
  if (!resolved) {
    return jsonRegistryResponse(
      { error: 'Invalid or oversized ThemeSpec token' },
      400,
    )
  }
  const baseUrl = new URL(request.url).origin
  return jsonRegistryResponse(buildRegistryIndex(spec, baseUrl))
}
