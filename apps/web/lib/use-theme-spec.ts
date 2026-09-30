'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import {
  auditContrast,
  decodeThemeSpec,
  deriveTheme,
  encodeThemeSpec,
  generationFromPresetId,
  serializeCss,
  serializeTailwindV4,
  type AuditFinding,
  type ResolvedTheme,
  type ThemeSpec,
} from '@handstyle/tokens'
import { scopeThemeCss } from './apply-theme-css'
import { createDefaultThemeSpec, installCommandFor } from './default-theme'

function readSpecFromUrl(): ThemeSpec | null {
  if (typeof window === 'undefined') return null
  const token = new URLSearchParams(window.location.search).get('s')
  if (!token) return null
  return decodeThemeSpec(token)
}

export function useThemeSpec() {
  const [spec, setSpec] = useState<ThemeSpec>(() => createDefaultThemeSpec())
  const [urlReady, setUrlReady] = useState(false)
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light')
  const [copyStatus, setCopyStatus] = useState<string | null>(null)
  const [origin, setOrigin] = useState('https://handstyle.dev')

  // Apply share URL before paint so we don't overwrite ?s= with the default theme.
  useLayoutEffect(() => {
    const fromUrl = readSpecFromUrl()
    if (fromUrl) setSpec(fromUrl)
    setUrlReady(true)
  }, [])

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const theme: ResolvedTheme = useMemo(() => deriveTheme(spec), [spec])
  const findings: AuditFinding[] = useMemo(() => auditContrast(theme), [theme])
  const token = useMemo(() => encodeThemeSpec(spec), [spec])
  const css = useMemo(() => serializeCss(theme), [theme])
  const themeCss = useMemo(() => serializeTailwindV4(theme), [theme])
  const previewCss = useMemo(() => scopeThemeCss(theme), [theme])
  const installCmd = useMemo(() => installCommandFor(token, origin), [token, origin])

  useEffect(() => {
    if (!urlReady) return
    const url = new URL(window.location.href)
    url.searchParams.set('s', token)
    window.history.replaceState(null, '', url.toString())
  }, [token, urlReady])

  const updateSpec = useCallback((updater: (prev: ThemeSpec) => ThemeSpec) => {
    setSpec((prev) => updater(prev))
  }, [])

  const setBrandColor = useCallback(
    (hex: string) => {
      updateSpec((prev) => ({
        ...prev,
        scales: prev.scales.map((s) =>
          s.role === 'brand' && s.name === 'brand' ? { ...s, baseColor: hex } : s,
        ),
      }))
    },
    [updateSpec],
  )

  const setScaleColor = useCallback(
    (name: string, hex: string) => {
      updateSpec((prev) => ({
        ...prev,
        scales: prev.scales.map((s) => (s.name === name ? { ...s, baseColor: hex } : s)),
      }))
    },
    [updateSpec],
  )

  const setPreset = useCallback(
    (presetId: string) => {
      updateSpec((prev) => ({
        ...prev,
        generation: generationFromPresetId(presetId),
      }))
    },
    [updateSpec],
  )

  const setRadius = useCallback(
    (radius: NonNullable<ThemeSpec['radius']>) => {
      updateSpec((prev) => ({ ...prev, radius }))
    },
    [updateSpec],
  )

  const setName = useCallback(
    (name: string) => {
      updateSpec((prev) => ({ ...prev, name }))
    },
    [updateSpec],
  )

  const setNeutralMode = useCallback(
    (mode: ThemeSpec['neutral']['mode']) => {
      updateSpec((prev) => ({
        ...prev,
        neutral:
          mode === 'custom'
            ? { mode, baseColor: prev.neutral.baseColor ?? '#808080' }
            : { mode },
      }))
    },
    [updateSpec],
  )

  const copyText = useCallback(async (label: string, text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        throw new Error('clipboard unavailable')
      }
      setCopyStatus(`${label} copied`)
    } catch {
      try {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.setAttribute('readonly', '')
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        const ok = document.execCommand('copy')
        document.body.removeChild(ta)
        setCopyStatus(ok ? `${label} copied` : `Could not copy ${label}`)
      } catch {
        setCopyStatus(`Could not copy ${label}`)
      }
    }
    window.setTimeout(() => setCopyStatus(null), 2000)
  }, [])

  const shareUrl = useCallback(() => {
    if (typeof window === 'undefined') return ''
    const url = new URL(window.location.href)
    url.searchParams.set('s', token)
    return url.toString()
  }, [token])

  return {
    spec,
    theme,
    findings,
    token,
    css,
    themeCss,
    previewCss,
    installCmd,
    previewMode,
    setPreviewMode,
    hydrated: urlReady,
    copyStatus,
    setBrandColor,
    setScaleColor,
    setPreset,
    setRadius,
    setName,
    setNeutralMode,
    copyText,
    shareUrl,
  }
}

export type ThemeSpecController = ReturnType<typeof useThemeSpec>
