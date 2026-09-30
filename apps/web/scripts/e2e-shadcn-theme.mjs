#!/usr/bin/env node
/**
 * Phase 5 smoke: fetch dynamic theme registry item and assert payload shape.
 * Optional: run `npx shadcn add` into a temp project when SHADCN_E2E=1.
 *
 * Usage:
 *   BASE_URL=http://127.0.0.1:3010 node apps/web/scripts/e2e-shadcn-theme.mjs
 *   SHADCN_E2E=1 BASE_URL=http://127.0.0.1:3010 node apps/web/scripts/e2e-shadcn-theme.mjs
 */
import { spawnSync } from 'node:child_process'
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
  readdirSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const BASE = (process.env.BASE_URL ?? 'http://127.0.0.1:3010').replace(/\/$/, '')

/** Minimal valid ThemeSpec (matches @handstyle/tokens schema). */
function demoToken() {
  const spec = {
    v: 1,
    name: 'E2E Brand',
    generation: {
      lightSteps: 5,
      darkSteps: 5,
      presetId: 'tailwind',
      chromaMode: 'saturated',
    },
    scales: [{ name: 'brand', baseColor: '#0D7377', role: 'brand' }],
    neutral: { mode: 'tinted' },
    radius: 'md',
    density: 'default',
  }
  return Buffer.from(JSON.stringify(spec), 'utf8').toString('base64url')
}

function findFile(dir, name) {
  const entries = readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const p = join(dir, e.name)
    if (e.isFile() && e.name === name) return p
    if (e.isDirectory() && e.name !== 'node_modules') {
      const hit = findFile(p, name)
      if (hit) return hit
    }
  }
  return null
}

async function main() {
  const token = demoToken()
  const themeUrl = `${BASE}/r/t/${token}/theme`
  const tokensUrl = `${BASE}/r/t/${token}/tokens`

  console.log(`GET ${themeUrl}`)
  const themeRes = await fetch(themeUrl)
  if (!themeRes.ok) {
    throw new Error(`theme route HTTP ${themeRes.status}: ${await themeRes.text()}`)
  }
  const themeItem = await themeRes.json()
  if (themeItem.error) throw new Error(themeItem.error)
  if (themeItem.name !== 'theme') throw new Error('expected name=theme')
  if (!themeItem.files?.length) throw new Error('theme item missing files')
  const css = themeItem.files[0]?.content ?? ''
  if (!css.includes('--bg-brand')) throw new Error('CSS missing --bg-brand')
  if (!css.includes('--primary')) throw new Error('CSS missing --primary')
  if (!css.includes('@theme')) throw new Error('CSS missing @theme')
  console.log('✓ theme registry item OK')

  console.log(`GET ${tokensUrl}`)
  const tokensRes = await fetch(tokensUrl)
  if (!tokensRes.ok) throw new Error(`tokens route HTTP ${tokensRes.status}`)
  const tokensItem = await tokensRes.json()
  if (!tokensItem.files?.[0]?.content?.includes('--bg-brand')) {
    throw new Error('tokens CSS missing --bg-brand')
  }
  console.log('✓ tokens registry item OK')

  if (process.env.SHADCN_E2E === '1') {
    await runShadcnAdd(themeUrl)
  } else {
    console.log('Skip shadcn CLI (set SHADCN_E2E=1 to enable)')
  }

  console.log('Phase 5 smoke passed')
}

async function runShadcnAdd(themeUrl) {
  const dir = mkdtempSync(join(tmpdir(), 'handstyle-e2e-'))
  console.log(`Temp project: ${dir}`)
  try {
    mkdirSync(join(dir, 'src/app'), { recursive: true })
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify(
        {
          name: 'handstyle-e2e',
          private: true,
          type: 'module',
          dependencies: {
            next: '^15.5.4',
            react: '^19.1.1',
            'react-dom': '^19.1.1',
            tailwindcss: '^4.1.13',
          },
        },
        null,
        2,
      ),
    )
    writeFileSync(
      join(dir, 'components.json'),
      JSON.stringify(
        {
          $schema: 'https://ui.shadcn.com/schema.json',
          style: 'new-york',
          rsc: true,
          tsx: true,
          tailwind: {
            config: '',
            css: 'src/app/globals.css',
            baseColor: 'neutral',
            cssVariables: true,
          },
          aliases: {
            components: '@/components',
            utils: '@/lib/utils',
            ui: '@/components/ui',
            lib: '@/lib',
            hooks: '@/hooks',
          },
        },
        null,
        2,
      ),
    )
    writeFileSync(
      join(dir, 'tsconfig.json'),
      JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2017',
            lib: ['dom', 'dom.iterable', 'esnext'],
            allowJs: true,
            skipLibCheck: true,
            strict: true,
            noEmit: true,
            esModuleInterop: true,
            module: 'esnext',
            moduleResolution: 'bundler',
            resolveJsonModule: true,
            isolatedModules: true,
            jsx: 'preserve',
            incremental: true,
            paths: { '@/*': ['./src/*'] },
          },
          include: ['**/*.ts', '**/*.tsx'],
          exclude: ['node_modules'],
        },
        null,
        2,
      ),
    )
    writeFileSync(join(dir, 'src/app/globals.css'), '@import "tailwindcss";\n')

    const add = spawnSync(
      'npx',
      ['--yes', 'shadcn@latest', 'add', themeUrl, '--overwrite', '-y'],
      { cwd: dir, encoding: 'utf8', timeout: 180_000 },
    )
    if (add.stdout) console.log(add.stdout)
    if (add.status !== 0) {
      if (add.stderr) console.error(add.stderr)
      throw new Error(`shadcn add failed with status ${add.status}`)
    }

    const path = findFile(dir, 'handstyle-theme.css')
    if (!path) throw new Error('handstyle-theme.css not written by shadcn add')
    const written = readFileSync(path, 'utf8')
    if (!written.includes('--bg-brand') || !written.includes('--primary')) {
      throw new Error('installed CSS missing expected tokens')
    }
    console.log(`✓ shadcn add wrote ${path}`)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
