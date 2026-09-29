# Handstyle — Architecture (Phase 0)

Stand: Analyse abgeschlossen; Entscheidungen Q1–Q10 und Nachzüge eingefroren. Kein Implementierungscode.

Referenz-Repos (Analyse): Tintfield (`schroepa/Color-Ramp-Generator-`), cmplt (`schroepa/cmplt-design-system`). Phase 1 arbeitet im **echten Tintfield-Repo**, nicht in lokalen `_refs/`.

---

## 1. Produktkern

**Eine Markenfarbe (oder mehrere) → `ThemeSpec` → deterministisch Primitive → Semantic → Component → Ausgaben** (CSS / Tailwind v4 / DTCG / Figma-Payload / Paper-flache Vars / `design.md` / shadcn-Registry).

Quelle der Wahrheit ist immer die versionierte `ThemeSpec`. Figma und Paper schreiben nie ungefragt zurück; sie schlagen vor (`packages/sync`).

---

## 2. Sharing-Modell (entschieden)

**Option A bestätigt**, mit fester Engine-Heimat:

| Produkt | Repo | Geteilte Pakete |
|---------|------|-----------------|
| **Tintfield** | eigenes Repo → **pnpm Workspace**: App + `packages/engine` | veröffentlicht `@tintfield/engine` |
| **Handstyle** | dieses Repo → pnpm Workspace `apps/*` + `packages/*` | konsumiert `@tintfield/engine` (veröffentlichte Versionen); eigene `@handstyle/tokens`, `@handstyle/sync`, … |
| **cmplt** | eigenes Repo | Registry `@cmplt/*`; Token-Vertrag gemeinsam (Phase 3 Migration) |

- Kein Forken von App-Code zwischen den drei Produkten.
- Kein Git-Submodule.
- Handstyle hängt an **npm-Versionen** der Engine, nicht an einem Workspace-Link zum Tintfield-Repo (lokales `pnpm link` nur für Dev nach Absprache).

---

## 3. Monorepo-Layouts

### Tintfield (Heimat der Engine)

```
tintfield/
  packages/
    engine/          # @tintfield/engine — framework-frei, culori, getestet
  apps/ oder src/    # bestehende Astro-App, konsumiert das Paket
```

**Vor Extraktion — Legacy-Aufräumen (eigener Commit):**

1. `ramp-engine.test.ts` prüfen: Laufen die Tests gegen `generateFromPreset` (nicht gegen die Legacy-API)? → **Datei umbenennen** (z. B. `generate-from-preset.test.ts`), **nicht löschen**. Snapshots müssen erhalten bleiben (mitumbenennen / Pfad anpassen).
2. Erst danach `ramp-engine.ts` (toter Legacy-Motor) löschen.
3. Produktiv ist und bleibt `presets/generate.ts`.

### Handstyle

```
handstyle/
  packages/
    tokens/          # @handstyle/tokens — ThemeSpec, Ableitung, Audit, Serializer
    registry/        # Handstyle Registry-Items (Theme/Tokens), referenzieren @cmplt/*
    sync/            # Diff, Klassifizierung, Drift, Konflikte, Digest
  apps/
    web/             # Next.js: Generator, Docs, Galerie, /r/t/[spec]/*, OG
    figma-plugin/
    mcp/             # Theme-Tools für Agenten (u. a. Paper)
```

**Turborepo:** nein vorerst. Nur pnpm Workspaces. Erneut prüfen ab Phase 5/6.

**Keine Engine im Handstyle-Repo** — nur Dependency auf `@tintfield/engine`.

---

## 4. Framework-Wahl: `apps/web`

**Next.js** (App Router, dynamische Registry, `next/og`, Vercel). Tintfield bleibt Astro und importiert nur `@tintfield/engine`.

---

## 5. Datenfluss

```
                    ┌─────────────┐
  Markenfarben ──►  │ ThemeSpec   │  (JSON, versioniert, sharebar)
                    └──────┬──────┘
                           │
         @tintfield/engine (Ramps)
                           │
              normalize → kanonische Stufen
                           │
              @handstyle/tokens derive()
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
    Primitives         Semantics         Components
    (--brand-500)      (--bg-brand)      (Aliases)
         │                 │                 │
         └──────── contrast audit ───────────┘
                           │
         ┌─────────┬───────┴───────┬──────────┬─────────┐
         ▼         ▼               ▼          ▼         ▼
      tokens.css  @theme      DTCG/Figma   paper     design.md
      + shadcn-   Tailwind     Payload     flat CSS
      aliases
                           │
              apps/web /r/t/[spec]/*  +  OG
                           │
         ┌─────────────────┼──────────────────┐
         ▼                 ▼                  ▼
   npx shadcn add     Figma Plugin      apps/mcp → Paper MCP
   (theme + @cmplt)   (Adapter→sync)    (Agent-Prompt)
```

---

## 6. Token-Vertrag (gemeinsam, entschieden)

**Ein Vertrag, keine parallelen Namen.** cmplt wird in Phase 3 einmalig darauf migriert. Handstyle-Ausgaben enthalten **kein** `--cmplt-`.

| Schicht | Konvention | Beispiel |
|---------|------------|----------|
| **Primitive** | Scale-Slug + **kanonische** Stufe | `--brand-500`, `--neutral-25`, `--success-500` |
| **Semantic** | kurze Rollen, **ohne** Produktpräfix | `--bg-surface`, `--bg-brand`, `--fg-primary` |
| **Data** | Diagramm-/Datenreihe | `--data-1` … `--data-5` |
| **Tailwind v4 `@theme`** | `--color-*`, `--radius-*`, … | `--color-bg-surface: var(--bg-surface)`; shadcn: `bg-primary` = Marke, `bg-accent` = Hover |
| **Component** | nur wo nötig, Alias auf Semantic | später |
| **shadcn-Kompatibilität** | reine Ausgabe-Aliase, nie Quelle | siehe §9 |

### Kanonischer Stufensatz

Jede Ramp wird auf denselben Stufensatz **normalisiert**:

```
0, 25, 50, 100, 200, 300, 400, 500, 600, 700, 750, 800, 850, 900, 950
```

- Das **Preset** (Tailwind, Radix, Material, …) bestimmt nur die **Helligkeitsverteilung** / Ladder-Metrik der Engine-Ausgabe.
- Nach der Generierung: Mapping bzw. Interpolation auf die kanonischen Steps.
- Default-`semanticMap` und alle Default-Mappings referenzieren **nur** kanonische Stufen (`brand-500`, `neutral-25`, …) — nie Preset-lokale IDs wie Radix `9` oder Material `40`.

### Neutral-Erzeugung (Q5)

- Neutral ist **kein** Eintrag in `scales[]` / `ScaleRole`.
- Ausschließlich über `ThemeSpec.neutral` (siehe §7).
- Helligkeitsleiter = kanonische Stufen oben.
- **Default „Tinted“:** Hue + sehr niedrige Chroma aus der Brand-Farbe.
- Umschalter: **Tinted (Default)** | **Warm (Hue 85)** | **Kühl** | **Custom** (+ `baseColor`).

### Brand-Semantik (Q6) — nicht „accent“

Markenrollen heißen **`brand`**, nicht `accent` (vermeidet Kollision mit shadcn `--accent` = Hover):

| Semantic | Bedeutung |
|----------|-----------|
| `--bg-brand` | Markenfläche (CTA, Primary) |
| `--bg-brand-hover` | Hover der Markenfläche |
| `--bg-brand-subtle` | dezente Markentönung |
| `--fg-on-brand` | Text/Icon auf Markenfläche |
| `--fg-brand` | Markenfarbe als Text |
| `--border-brand` | Markenkontur |
| `--ring-focus` | Fokusring (typisch Brand-Step) |

- **Ein Mapping:** dieselbe Brand-Ramp in Light und Dark (Steps können sich unterscheiden).
- **Kein** Dual-Polarity-Preset. Abweichungen nur über `semanticMap`.
- **cmplt Phase 3:** Komponenten von bisherigen Accent-Klassen/`--bg-accent` auf `--bg-brand` bzw. Utilities umstellen. In der **@theme-/shadcn-Schicht** gilt: `bg-primary` = Marke, `bg-accent` = Hover-Fläche (`--bg-subtle`).

### Feedback-Fallbacks (Q7)

- Wenn der Nutzer keine Feedback-Farben setzt: feste Hue-Familien **grün / bernstein / rot / blau**, klar als **Beispiel** gelabelt.
- Gleiche Preset-Leiter → Normalisierung auf kanonische Steps; Chroma angeglichen.
- Audit warnt bei Verwechslungsgefahr Brand ↔ Feedback.

### Data-Reihe

| Semantic | Default-Quelle (Beispiel) |
|----------|---------------------------|
| `--data-1` | `brand-500` |
| `--data-2` … `--data-5` | Feedback-/Harmonie-Steps (Beispiel-Palette) |

shadcn `--chart-1` … `--chart-5` **aliasen** auf `--data-1` … `--data-5` (nie eigene Quelle).

---

## 7. ThemeSpec-Entwurf (v1)

```ts
type StepRef = `${string}-${CanonicalStep}` // z. B. "brand-500", "neutral-25"
type CanonicalStep =
  | 0 | 25 | 50 | 100 | 200 | 300 | 400 | 500
  | 600 | 700 | 750 | 800 | 850 | 900 | 950

/** v1: nur Brand- und Feedback-Scales; Neutral über ThemeSpec.neutral */
type ScaleRole = 'brand' | 'feedback'

type GenerationSettings = {
  lightSteps: number
  darkSteps: number
  presetId: string
  chromaMode?: 'saturated' | 'fade' | 'pale'
}

type NeutralMode = 'tinted' | 'warm' | 'cool' | 'custom'

type ThemeSpec = {
  v: 1
  name: string
  generation: GenerationSettings
  scales: {
    name: string
    baseColor: string
    role: ScaleRole
    feedbackKind?: 'success' | 'warning' | 'danger' | 'info'
    baseOverride?: string | null
  }[]
  neutral: {
    mode: NeutralMode
    /** nur bei mode: 'custom' */
    baseColor?: string
  }
  semanticMap?: Partial<
    Record<SemanticTokenName, { light: StepRef; dark: StepRef }>
  >
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  density?: 'compact' | 'default' | 'comfortable'
}
```

Ableitung:

1. **Primitive** — Engine-Ramp → **Normalisierung auf kanonische Stufen**; Feedback-Fallbacks wenn fehlend.
2. **Semantic** — Default-Mapping (§8); Overrides aus `semanticMap` (nur kanonische `StepRef`s).
3. **Data** — `--data-1`…`--data-5`.
4. **Component** — v1 minimal.
5. **shadcn-Aliase** — §9, reine Ausgabe.

Encode: Base64url der Spec (isomorph). URL-Länge für typische Themes unkritisch; Kurz-IDs erst Phase 9 (Galerie/Remix).

---

## 8. Semantic-Token-Liste & Default-Mapping

Philosophie: keine reinen #FFF/#000-Pole; 4-stufige Surface-Hierarchie + muted. Alle Werte als **Aliase auf kanonische Primitive-Steps**.

### Surface & Text (Neutral via `ThemeSpec.neutral`)

| Semantic | Light | Dark |
|----------|-------|------|
| `--bg-canvas` | `neutral-100` | `neutral-950` |
| `--bg-surface` | `neutral-25` | `neutral-900` |
| `--bg-elevated` | `neutral-0` | `neutral-800` |
| `--bg-subtle` | `neutral-50` | `neutral-850` |
| `--bg-muted` | `neutral-200` | `neutral-750` |
| `--fg-primary` | `neutral-950` | `neutral-100` |
| `--fg-secondary` | `neutral-600` | `neutral-400` |
| `--fg-muted` | `neutral-500` | `neutral-500` |
| `--border-subtle` | `neutral-200` | `neutral-750` |
| `--border-default` | `neutral-300` | `neutral-700` |
| `--border-strong` | `neutral-400` | `neutral-600` |

### Brand (gleiche Ramp, beide Modes)

| Semantic | Light | Dark |
|----------|-------|------|
| `--bg-brand` | `brand-500` | `brand-500` (oder `brand-400` nach Audit) |
| `--bg-brand-hover` | `brand-600` | `brand-400` |
| `--bg-brand-subtle` | heller Brand-Step | dunkler Brand-Step |
| `--fg-on-brand` | computed / Neutral-hell | computed |
| `--fg-brand` | `brand-500` | `brand-400` |
| `--border-brand` | `brand-400` | `brand-400` |
| `--ring-focus` | `brand-500` | `brand-400` |

### Feedback

| Semantic | Quelle |
|----------|--------|
| `--status-success` / `-bg` | Scale `success` (Beispiel-Grün oder Nutzer) |
| `--status-warning` / `-bg` | Scale `warning` |
| `--status-danger` / `-bg` | Scale `danger` |
| `--status-info` / `-bg` | Scale `info` |

### Data

| Semantic | Default |
|----------|---------|
| `--data-1` | `brand-500` |
| `--data-2` … `--data-5` | Beispiel-Harmonie / Feedback-Steps |

**Phase-2-Audit zuerst (Priorität):**

1. `--fg-muted` (`neutral-500`) in **beiden** Modes gegen Canvas / Surface / Elevated / Muted.
2. Hover-Kontrast: shadcn-`--accent` → `--bg-subtle` **auf** `--bg-surface` (und ggf. elevated) — Lesbarkeit von Text/`--accent-foreground` auf der Hover-Fläche.

---

## 9. shadcn-Kompatibilitätsschicht (Ausgabe, nie Quelle)

Gegen aktuelle [shadcn Theming-Doku](https://ui.shadcn.com/docs/theming).

**Trennung Marke vs. Hover:**

- Marke → Handstyle `--bg-brand` → shadcn `--primary` → Utility `bg-primary`
- Hover-Fläche → Handstyle `--bg-subtle` → shadcn `--accent` → Utility `bg-accent`  
  (`--accent` ist **nicht** die Markenfarbe.)

| shadcn-Token | Alias auf Handstyle | Hinweis |
|--------------|---------------------|---------|
| `--background` | `--bg-canvas` | |
| `--foreground` | `--fg-primary` | |
| `--card` | `--bg-surface` | |
| `--card-foreground` | `--fg-primary` | |
| `--popover` | `--bg-elevated` | |
| `--popover-foreground` | `--fg-primary` | |
| `--primary` | `--bg-brand` | **Marke** |
| `--primary-foreground` | `--fg-on-brand` | |
| `--secondary` | `--bg-muted` | |
| `--secondary-foreground` | `--fg-primary` | |
| `--muted` | `--bg-muted` | |
| `--muted-foreground` | `--fg-muted` | Audit-Priorität |
| `--accent` | `--bg-subtle` | **Hover**, nicht Brand |
| `--accent-foreground` | `--fg-primary` | Audit mit Hover |
| `--destructive` | `--status-danger` | |
| `--border` | `--border-default` | |
| `--input` | `--border-default` | |
| `--ring` | `--ring-focus` | |
| `--chart-1` … `--chart-5` | `--data-1` … `--data-5` | nur Alias |
| `--sidebar` | `--bg-subtle` | |
| `--sidebar-foreground` | `--fg-primary` | |
| `--sidebar-primary` | `--bg-brand` | |
| `--sidebar-primary-foreground` | `--fg-on-brand` | |
| `--sidebar-accent` | `--bg-muted` | |
| `--sidebar-accent-foreground` | `--fg-primary` | |
| `--sidebar-border` | `--border-subtle` | |
| `--sidebar-ring` | `--ring-focus` | |
| `--radius` | aus `ThemeSpec.radius` / Basis | shadcn leitet `radius-sm`… ab |

Tailwind v4: Tokens über `@theme inline` als `--color-*` exponieren.

---

## 10. Cross-Registry (shadcn ↔ cmplt)

CLI unterstützt Item-Adressen: `@cmplt/button`, URLs, Namespaces in `components.json`.

```json
"registries": {
  "@handstyle": "https://<handstyle-host>/r/{name}.json",
  "@cmplt": "https://<cmplt-host>/r/{name}.json"
}
```

`handstyle.dev` ist **Platzhalter**, bis die Domain registriert ist. In Docs/Beispielen als solchen kennzeichnen; produktive URLs erst nach Domain-Entscheidung.

Bare Namen (`button`) = offizielle shadcn-Registry. cmplt/Handstyle nutzen `@namespace/…`. Phase 5 E2E-Test Pflicht.

---

## 11. Figma & Paper

### Figma

- Code→Figma: Plugin API; REST Variables nur Enterprise (später).
- Collections: Primitives / Semantic (Light+Dark) / Component.
- Idempotenz via `pluginData`; Digest für Konflikte.
- DTCG-Import nur Fallback.
- UI-Kit manuell; Code Connect → cmplt.
- Variablen-Namen: `color/bg/brand`, `color/bg/surface` (Gruppierung mit `/`).

### Paper

- Tokens = CSS-Variablen; Anlage via Agent + Paper MCP (+ inzwischen in-app).
- Theme-Modes (Dark) **noch auf Roadmap** → Light default; Dark als eigenes Theme; UI/Docs erklären das.
- Serializer `paper`: flache, aufgelöste Vars; modes-ready bauen.
- **Q10:** Alias-/Token-Verhalten erst gegen **Paper Desktop** verifizieren, bevor Serializer final (Phase 8).

---

## 12. Wiederverwendbare Dateien & Anpassungsbedarf

### Tintfield → `@tintfield/engine`

| Datei | Übernehmen? | Anpassung |
|-------|-------------|-----------|
| `presets/types.ts`, `builtins.ts`, `generate.ts` | ja (Kern) | Cache resetbar; keine localStorage |
| `hue-shift.ts`, `contrast.ts`, `ramp-quality.ts` | ja | — |
| `generation-settings.ts` | ja | Persistenz raus |
| `color-system.ts` | teilweise | schlanke Fassade |
| `export-formats.ts` | Formatter optional | DOM raus (App) |
| `share-state.ts` | encode/decode-Idee | Schema → ThemeSpec liegt in Handstyle |
| **`ramp-engine.ts`** | **löschen** (nach Test-Check) | eigener Commit **vor** Extraktion |
| **`ramp-engine.test.ts` + Snapshots** | **behalten** | Wenn Tests `generateFromPreset` nutzen: **umbenennen**, nicht löschen; Snapshots mitnehmen |
| App-Module (density, surface, preview, storage, …) | nein | UX-Referenz für Handstyle-Generator |

**Runtime-Dependency:** `culori` only.

### cmplt (Phase 3, im cmplt-Repo)

- Migration auf Token-Vertrag (§6): kein `--cmplt-`; Semantic `--bg-brand` statt Accent-als-Marke; Utilities: Marke = `primary`/`bg-brand`, Hover = `accent`/`bg-subtle`.
- Coral/Jade/Indigo-Defaults raus; Neutral über denselben Vertrag.
- Blocks ohne hartcodierte Paletten.
- `globals.css` `@theme`-Bridge mitdenken.
- Meta `inventor`/`owner` nicht in Handstyle spiegeln.

### Neu in Handstyle

`@handstyle/tokens`, `@handstyle/registry`, `@handstyle/sync`, `apps/web`, `apps/figma-plugin`, `apps/mcp`.

---

## 13. Kontrast & Qualität

- WCAG 2.2 AA verbindlich; Verstöße markieren, Export nicht blockieren.
- APCA optional.
- **Phase 2 Start:** (1) `--fg-muted` / `neutral-500` beide Modes; (2) Hover `--bg-subtle` auf `--bg-surface`.
- Warnung Brand ↔ Feedback Verwechslungsgefahr (Q7).

---

## 14. Entscheidungen Q1–Q10 + Nachzüge (Protokoll)

| ID | Entscheidung |
|----|----------------|
| Q1 | Kein Turborepo vorerst; pnpm Workspaces; Check ab Phase 5/6 |
| Q2 | Engine = `@tintfield/engine` im Tintfield-Repo; Handstyle konsumiert Releases |
| Q3 | Ein Token-Vertrag; kein `--cmplt-` in Handstyle; cmplt migriert in Phase 3 |
| Q4 | Option A; Engine-Heimat Tintfield (Q2) |
| Q5 | Kanonische Stufen; Neutral-Modi Tinted / Warm / Kühl / Custom nur über `ThemeSpec.neutral` |
| Q6 | Ein Brand-Mapping; Semantic `--*-brand`; kein Dual-Polarity; kein ScaleRole `accent` |
| Q7 | Feste Beispiel-Hue-Familien für Feedback; Audit Brand↔Feedback |
| Q8 | `_refs/` gitignored + gelöscht; Phase 1 im echten Tintfield-Repo |
| Q9 | Dieses Doc → git init + `.gitignore` + erster Commit (kein Push ohne Bestätigung) |
| Q10 | Paper-Serializer erst nach Verifikation gegen Paper Desktop |

**Nachzüge:**

- ScaleRole v1 = `'brand' \| 'feedback'` (kein `neutral`, kein `accent`).
- Kanonische Stufen 0/25/50/…/950; Preset = nur Helligkeitsverteilung; Default-Mapping nur kanonisch.
- `--data-1`…`--data-5`; `--chart-*` aliasen darauf.
- Hover-Audit (`--accent` → `--bg-subtle` auf `--bg-surface`) in Phase-2-Erstaudit.
- `handstyle.dev` = Domain-Platzhalter.
- Tests: `ramp-engine.test.ts` vor Löschen von `ramp-engine.ts` prüfen → ggf. umbenennen, Snapshots behalten.

---

## 15. Phasen (Erinnerung)

| Phase | Ort | Stopp |
|-------|-----|-------|
| 0 | Handstyle | dieses Dokument + Freigabe ✓ |
| 1 | **Tintfield-Repo** | Test-Rename-Check → `ramp-engine.ts` weg → `@tintfield/engine` → Tests/Snapshots grün → App umgestellt |
| 2 | Handstyle | ThemeSpec, kanonische Normalisierung, Audit (fg-muted + Hover), Serializer |
| 3 | **cmplt-Repo** | Token-Vertrag + Brand-Semantik; Handstyle referenziert |
| 4–5 | Handstyle | Generator; dynamische Registry + `npx shadcn add` E2E |
| 6–7 | Handstyle | Figma Push / Propose |
| 8 | Handstyle | MCP + Paper (nach Desktop-Check) |
| 9 | Handstyle | Kurz-IDs / Galerie |

---

## 16. Risiken

1. Engine-Releases vs. Handstyle-Dev: Version-Pinning / Changesets in Tintfield nötig.
2. cmplt-Migration (Phase 3) ist Breaking (`--bg-accent` → `--bg-brand`, Präfix weg) — Changelog und ggf. Major.
3. Registry ohne `@theme`-Bridge → tote Utilities.
4. Bare `registryDependencies` → falsche Registry.
5. Paper ohne Modes → Dual-Export kommunizieren; Serializer nicht vor Desktop-Check finalisieren.
6. Preset-Stufen ≠ kanonische Stufen: Normalisierungsfehler würden Default-Mapping brechen — Tests in Phase 2 Pflicht.

---

*Phase 0 abgeschlossen.*
