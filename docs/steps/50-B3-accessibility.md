# 50 · B3 Accessibility: axe, contrast, targets

Phase 8 · 45 min · Depends: FE5, B1 · Decisions: D13.1 B, D13.5 A

## Goal

The accessibility numbers per route and state on the production server:
axe violations by impact, contrast failures, small targets.

## What this step does

1. **The accessibility collectors from step 45 run on the production server**
   for every route, in two states (with data as the demo user, empty as a
   user with no rows) and two widths.
2. **Counts per route and state**: axe violations by impact with the rules
   hit, contrast failures with the worst ratio, targets under 24 and under
   44 pixels.
3. **Screenshots** of every route and state for the dashboard.

After this step the accessibility columns of the table exist.

## Implementation details

### `src/bench/accessibility.ts`

```ts
export type AccessibilityRow = { route: string; state: 'default' | 'empty'; width: number; axe: { critical: number; serious: number; moderate: number; minor: number; rules: { id: string; impact: string; nodes: number }[] }; contrast: { failures: number; worst: number | null }; targets: { small24: number; small44: number } };
export async function runAccessibility(opts: { run: Run; baseUrl: string; routes: RouteSample[] }): Promise<AccessibilityRow[]>;
```

- States: `default` as `demo@example.com`, `empty` as `other@example.com`
  (no rows), both through `signedInContext` (step 45); public routes once,
  signed out.
- Widths: 375 and 1280 (320 is covered by the rendered checks' overflow).
- Reuse `axeCheck`, `contrastCheck`, `targetSizes` from `src/checks`.
- Write `benchmark/accessibility.json`; screenshots of each route and
  state to `benchmark/screenshots/<slug>-<state>-<width>.png` (the
  dashboard uses them).

## Done when

```sh
tsx src/bench/accessibility.ts <runId>     # a small CLI like step 49's
cat runs/<id>/benchmark/accessibility.json | head
```

shows counts per route and state.
