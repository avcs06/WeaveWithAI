# 18 · DS4 Theme generator

Phase 3 · 90 min · Depends: DS3 · Decisions: D3.3 B, D3.4 B · Spec:
specs/design.md "Theme: code, not a model"

## Goal

Deterministic palettes from the brief: twelve color roles in light and
dark for the primary set and every entity set, with WCAG contrast
guaranteed by construction, plus fonts, radius and focus ring.

## What this step does

1. **Code turns the brief into a theme**: for the primary set and every extra
   set, twelve color roles in light and dark, computed in OKLCH from the seed
   hue with lightness targets per role.
2. **Contrast is guaranteed by construction**: every text-on-background pair
   is nudged until it passes WCAG 4.5:1 (3:1 for borders and focus rings),
   then clamped to the screen's gamut.
3. **Fonts, radius presets and the focus ring** come straight from the brief;
   a contrast table is stored with the theme so the validator and the demo can
   show the ratios.
4. **Validators** check contrast, fonts and radius values; **a property test**
   runs 36 palettes through them.
5. **The design stage** writes `02-theme.json` right after the brief, with
   no model call.

After this step every generated app gets an accessible palette without a
model ever writing a color.

## Implementation details

### 1. Dependency

`pnpm add culori@^4.0.2`; add `@types/culori` if `tsc` can't find types.
Used: `oklch`, `formatHex`, `clampChroma`, `wcagContrast`, `parse`.

### 2. `src/stages/design/theme.ts`

```ts
export const Theme = z.object({...});   // the spec's Theme schema (ColorSet, entity, fonts, radius, focusRing, density, contrast)
export type Theme = z.infer<typeof Theme>;

export function buildTheme(brief: Brief): Theme;
export function buildColorSet(hue: number, chroma: 'muted' | 'balanced' | 'vivid', mode: 'light' | 'dark'): ColorSet;
export function contrastTable(theme: Theme): Theme['contrast'];
```

Algorithm for `buildColorSet`:

1. Base chroma by level: muted 0.06, balanced 0.12, vivid 0.17; backgrounds
   use a quarter of it, borders half.
2. Start every role at the spec's lightness target for the mode
   (`bg` 0.96/0.25, `hoverBg` 0.93/0.29, `border` 0.73/0.52, `fg` 0.33/0.90,
   `fgMuted` 0.50/0.77, `accentBg` 0.56/0.56, `accentHoverBg` 0.52/0.52,
   `accentBorder` 0.55/0.58, `accentFocus` 0.47/0.63), `focus = accentBg`,
   `shadow = #000000`.
3. `accentFg`: whichever of `#FFFFFF` and `#111111` has the higher
   `wcagContrast` on `accentBg`.
4. Nudge until the THEME-001 pairs pass 4.5:1: move the foreground's
   lightness away from its background in steps of 0.02 (light mode: darker
   text, dark mode: lighter), at most 30 steps; if still failing, move the
   background too. THEME-002 pairs (border and focus on bg) aim for 3:1 the
   same way, warning only.
5. `clampChroma` every color to sRGB before `formatHex`; upper-case hex.

`buildTheme`: primary from `seedHue` and `seedChroma`; each `entityColors`
entry the same with its own hue; fonts from the brief plus `JetBrains Mono`;
radius presets (sharp 4px/4px, soft 8px/6px, round 16px/10px, pill
16px/9999px); `focusRing`, `density` copied; `contrast` from
`contrastTable` listing every checked pair with its ratio.

### 3. Validators

In `validate.ts`: `validateTheme(theme)` with THEME-001 (mandatory), THEME-002
(warning), THEME-004 (fonts in the allowlist, radius values on the DS radius
scale from `tokens.ts`, focus ring in the enum). THEME-003 lives in step 36.

### 4. Stage

`runTheme(ctx)` after `runBrief` in the `design` stage: `buildTheme`,
`validateTheme` (a mandatory failure here is a code bug, throw), write
artifact `theme` with `model: null`, `inputs: ['brief']`.

### 5. Tests

`theme.test.ts`:

- Property style: for hue in `[0, 30, …, 330]` and each chroma level, both
  modes pass every THEME-001 pair (assert ratio ≥ 4.5 through
  `wcagContrast` on the produced hex values).
- A snapshot of `buildTheme(readingListBrief)`.
- THEME-004 fails on a font not in the allowlist (mutation).

## Done when

```sh
pnpm test -- src/stages/design/theme.test.ts   # 36 palettes pass
pnpm weave run … --to design                   # 02-theme.json beside 02-brief.json
```

## Watch out

- OKLCH lightness nudging can push a hue out of gamut; `clampChroma` first,
  then measure contrast on the clamped color, not the ideal one.
- The DS's `base`, `surface` and status sets are never produced here.
