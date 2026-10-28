# 52 · B5 Keyboard navigation

Phase 8 · 60 min · Depends: FE5, B1 · Decisions: D13.1 D

## Goal

Keyboard-only use of every route, measured: can every control be reached,
is focus visible, does the order follow reading order, is there a trap, do
dialogs close on Escape, do Enter and Space activate.

## What this step does

1. **The keyboard walk from step 45 runs on the production server** for every
   route at two widths, with mutations blocked so pressing Enter can't change
   data.
2. **Metrics per route**: reachability (which controls Tab never reached, by
   id), visible focus, order against reading order, traps, dialogs closing on
   Escape with focus returned, Enter and Space activating buttons, a skip
   link.

After this step keyboard-only use is a number per route, with the
unreachable elements named for repair.

## Implementation details

### `src/bench/keyboard.ts`

```ts
export type KeyboardRow = { route: string; width: number; interactive: number; reachable: number; reachabilityPct: number; focusVisiblePct: number; inversions: number; trap: boolean; dialogs: { opened: number; escaped: number; focusReturned: number }; activation: { buttons: number; enterOk: number; spaceOk: number }; skipLink: boolean; unreachable: string[] };
export async function runKeyboard(opts: { run: Run; baseUrl: string; routes: RouteSample[]; screens: Screens }): Promise<KeyboardRow[]>;
```

Reuse `keyboardWalk` from `src/checks/keyboard.ts` (step 45) on the
production server at 1280 and 375, signed in as demo, with mutations
blocked. `unreachable` lists the `data-testid` (or CSS path) of every
interactive element the Tab walk never reached, so a repair request can
name it. Output `benchmark/keyboard.json`.

Thresholds (D13.3): reachability 100%, focus visible 100%, no trap, every
opened dialog escaped with focus returned.

## Done when

```sh
tsx src/bench/keyboard.ts <runId>
```

prints a table with percentages per route; `benchmark/keyboard.json` exists.

## Watch out

- Radix-based DS components (menus, tabs) manage arrow keys themselves;
  the walk only presses Tab, Enter, Space and Escape.
