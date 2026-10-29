# 36 · S1 Scaffold and theme apply

Phase 6 · 90 min · Depends: R6, DS4 · Decisions: D0.3 A, D3.3 B, D3.4 B ·
Spec: specs/design.md "Theme" (THEME-003); ARCHITECTURE.md "Generated app"

## Goal

A generated app folder for the run: the template copied and installed, its
MCP built, and the frozen theme written into `colors.ts`, `tokens.ts` and
`fonts.ts` by code, with the neutral and status sets proven untouched.

## What this step does

1. **Create the app folder for the run**: copy the template with its own
   generator script (keeping the lockfile), install dependencies, build the
   design-system MCP inside the copy, write the app's `.env.local` so the
   frontend calls its own `/api`.
2. **Start the ledger**: a file that records every file the generator writes
   into the app, with its origin (code, model, repair). The benchmark's
   "lines by origin" and the ownership rules depend on it.
3. **Apply the frozen theme by editing code, not by regenerating files**:
   with ts-morph, set the twelve primary colors in light and dark, add the
   entity color sets, set the radius and focus ring tokens, and regenerate
   the fonts file with the chosen Google Fonts.
4. **Prove the untouchable sets are untouched**: the neutral, surface and
   status colors in the app's `colors.ts` must equal the template's
   (THEME-003); a difference is a bug and stops the stage.
5. **Register the `scaffold` stage** and run the app's own checks
   (typecheck, MCP check, verify) at the end.

After this step a run has a real, installed, themed app folder to generate
into.

## Before you start

- `template/tools/generate.mjs <source> <target> [--include-server] [--skip-setup]`
  copies the template (through the MCP symlink, so the app gets a real
  copy). The frontend-only variant drops the root lockfile, so the install
  would resolve fresh and slowly; use `--include-server` to keep the
  lockfile and ignore the `server/` folder.
- `template/colors.ts`: `colors.primary.light` and `.dark` hold the twelve
  roles, each object literal followed by `satisfies ColorSet`;
  `colors.entity.light` and `.dark` are empty objects; `base`, `surface`,
  `status` must never change. `tokens.ts`: `radius.surface: '8px'`,
  `radius.control: '6px'`, `focusRing: 'halo'`.
  `packages/styles/src/fonts.ts`: three `next/font/google` constants and
  `fontClasses`.
- A run's app lives at `runs/<runId>/app/` (gitignored). pnpm's store makes
  the install mostly hard links.

## Implementation details

### 1. `src/codegen/ledger.ts`

```ts
export type Origin = 'codegen' | 'model' | 'repair';
export type LedgerEntry = { origin: Origin; step: string; hash: string; writtenAt: string; modifiedTemplateFile?: boolean };
export type Ledger = { templateHash: string; files: Record<string, LedgerEntry> };
export function readLedger(run: Run): Ledger;
export function writeGenerated(run: Run, relPath: string, content: string, meta: { origin: Origin; step: string; modifiedTemplateFile?: boolean }): void;  // writes app/<relPath> (mkdir -p) and records it
export function appPath(run: Run, ...parts: string[]): string;   // runs/<id>/app/...
```

Every later codegen and model write goes through `writeGenerated`.

### 2. `src/app/scaffold.ts`

```ts
export async function scaffoldApp(run: Run, opts: { templateDir: string }): Promise<string>;
```

1. If `app/` exists and the ledger's `templateHash` equals the current
   template hash (reuse the inventory's hash function over the same file
   set plus `package.json` and `pnpm-lock.yaml`), return.
2. `execa('node', ['tools/generate.mjs', templateDir, appDir, '--include-server', '--skip-setup'], { cwd: templateDir, stdio: 'inherit' })`.
3. In `appDir`: `pnpm install --frozen-lockfile --prefer-offline`, then
   `pnpm mcp:setup`, then `pnpm mcp:check` (each an `execa` with
   `stdio: 'inherit'`; failures throw with the command named). Log a
   `check:run` event with durations.
4. Write `web/.env.local`:
   `NEXT_PUBLIC_API_URL=` (empty: the client calls `/api/...` on the same
   origin) and `MOCK_LATENCY_MS=150`.
5. Write the ledger with `templateHash`.

### 3. `src/app/theme.ts`

```ts
export function applyTheme(appDir: string, theme: Theme): string[];           // returns the changed files
export function validateThemeApplied(appDir: string, templateDir: string): Issue[]; // THEME-003
```

With `ts-morph@^28` (add it: `pnpm add ts-morph`):

- `const project = new Project({ skipAddingFilesFromTsConfig: true })`;
  `const colors = project.addSourceFileAtPath(join(appDir, 'colors.ts'))`.
- `const root = colors.getVariableDeclarationOrThrow('colors').getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression)`.
- A helper `objectOf(prop)` that takes a `PropertyAssignment`, reads its
  initializer and, when it's a `SatisfiesExpression`, returns
  `.getExpression()` as an `ObjectLiteralExpression`.
- Primary: `objectOf(root.getPropertyOrThrow('primary'))` → for `light`
  and `dark`: for each of the twelve roles
  `set.getPropertyOrThrow(role).asKindOrThrow(SyntaxKind.PropertyAssignment).setInitializer(`'${hex}'`)`.
- Entity: `objectOf(root.getPropertyOrThrow('entity'))` → `light`/`dark`
  objects → `addPropertyAssignment({ name, initializer: '{\n bg: …,\n … } satisfies ColorSet' })`
  per entity set (remove an existing property of the same name first).
- `tokens.ts`: the `radius` object's `surface` and `control` string
  literals, and `focusRing`.
- `fonts.ts`: regenerate from a template string: imports
  `{ <ui importName>, <display importName>, JetBrains_Mono } from 'next/font/google'`
  (dedupe when ui equals display), three constants with the weights from
  `src/config/fonts.ts`, `fontClasses` in the template's order (ui
  className and variable first).
- `project.saveSync()`; then `pnpm exec prettier --write` on the three files
  in the app (the template ships Prettier config). Record each in the
  ledger with `modifiedTemplateFile: true`.

`validateThemeApplied`: parse `colors.ts` in both folders and compare
`getPropertyOrThrow('base' | 'surface' | 'status').getText()`; any
difference is a mandatory THEME-003 issue. It is a code bug, so the stage
throws on it.

### 4. The `scaffold` stage

`src/app/stage.ts`: `scaffoldStage = { name: 'scaffold', produces: [], run }`:
read `spec.lock.json`, read the theme artifact and check its version
matches the lock, `scaffoldApp`, `applyTheme`, `validateThemeApplied`, then
in the app: `pnpm typecheck`, `pnpm verify /` (both through a small
`runAppCheck(run, name, args)` helper in `src/engine/tools.ts` that logs
`check:run`; step 41 builds on it). `state.stages.scaffold = done`.

### 5. Tests

`theme.test.ts`: copy `template/colors.ts`, `tokens.ts` and
`packages/styles/src/fonts.ts` into a temp folder; apply the reading-list
theme (`buildTheme(fixture brief)`); assert with ts-morph that
`primary.light.accentBg` equals the theme's hex, an entity set was added,
`radius.surface` changed, `fonts.ts` imports the brief's fonts;
`validateThemeApplied(temp, template)` returns no issues; each file
transpiles with `ts.transpileModule` without syntax errors.

## Done when

```sh
pnpm test -- src/app
pnpm weave run fixtures/ideas/freelancer-workspace.md --run <id> --to scaffold
cd runs/<id>/app && pnpm typecheck && pnpm mcp:check && pnpm verify /
grep -n "accentBg" colors.ts     # the theme's hex values under primary
```

## Watch out

- Never edit `base`, `surface` or `status`: THEME-003 exists so a slip here
  can't ship.
- `generate.mjs` refuses a non-empty target; a half-done scaffold must be
  deleted before a retry (`rm -rf runs/<id>/app`).
