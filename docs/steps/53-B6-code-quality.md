# 53 · B6 Code quality and duplicates

Phase 8 · 90 min · Depends: S5 · Decisions: D13.1 E, D13.1 F

## Goal

Every static number about the generated code in one JSON: type errors,
lint and validate findings by rule, copy-paste clones, design-system
duplicates, unused code, bundle size per route, lines by origin.

## What this step does

1. **Static numbers about the generated code**, all from the app folder:
   TypeScript errors; ESLint findings by rule; design-system validator
   findings by rule (the validator gets a `--json` flag); copy-paste clones
   found by jscpd with the duplicated percentage and the worst pairs;
   unused files, exports and dependencies from knip; first-load JavaScript
   per route computed from the build manifests; lines of code by origin from
   the ledger (template, code, model, repair).
2. **Design-system duplicates, five ways**: hand-built elements the design
   system has a component for, components named almost like a design-system
   one, native controls inside new components, data access outside the
   entities folder, the same component name in two routes.
3. **A test** plants a duplicate and sees it found.

After this step "duplicate implementations" is a measured number, not an
impression.

## Before you start

- `template/tools/validate-files.mjs` prints text; it gets a `--json` flag
  (template change) printing `[{ path, findings: [{ line, column, severity,
  rule, message, suggestion }] }]`.
- The MCP's TSX rules include `invalid-alternative` (a hand-built element
  the DS has a component for): the strongest "duplicate implementation"
  signal there is.
- After `next build`, `web/.next/app-build-manifest.json` maps each route
  (`/projects/page`) to its chunk files and `build-manifest.json` lists the
  shared `rootMainFiles`.

## Implementation details

```sh
pnpm add jscpd@^5.4.2 knip@^6.43.0
```

### `src/bench/code.ts`

```ts
export type CodeReport = {
  tsc: { errors: number; lines: string[] };
  eslint: { errors: number; warnings: number; byRule: Record<string, number> };
  validate: { errors: number; warnings: number; byRule: Record<string, number> };
  clones: { percentage: number; count: number; maxLines: number; top: { lines: number; files: [string, string] }[] };
  dsDuplicates: { handBuiltElements: number; nearNamedComponents: { name: string; dsName: string }[]; nativeControlsInComponents: { file: string; tag: string }[]; dataAccessOutsideEntities: string[]; sameNameAcrossRoutes: string[] };
  unused: { files: number; exports: number; dependencies: number };
  bundle: { route: string; firstLoadKbGzip: number }[];
  linesByOrigin: Record<'template' | 'codegen' | 'model' | 'repair', number>;
};
export async function runCodeQuality(opts: { run: Run; inventory: Inventory; screens: Screens }): Promise<CodeReport>;
```

In the app (`execa`, cwd `appDir`):

- tsc: `pnpm typecheck`; count lines matching `error TS`.
- ESLint: `pnpm exec eslint web/app --format json` → sum by `ruleId` and severity.
- Validate: `node tools/validate-files.mjs --json <every .ts/.tsx under web/app except __tests__>`.
- jscpd: `pnpm exec jscpd web/app --min-tokens 50 --min-lines 5 --reporters json --output benchmark/jscpd --ignore "**/*.test.*,**/__tests__/**,**/node_modules/**,**/.next/**"`
  → `benchmark/jscpd/jscpd-report.json`: `statistics.total.percentage`,
  `duplicates[]` (`lines`, `firstFile.name`, `secondFile.name`), top 5 by lines.
- DS duplicates: `handBuiltElements` = validate findings with rule
  `invalid-alternative`; `nearNamedComponents` = folder names under
  `web/app/components/` within Levenshtein 2 of an inventory name
  (case-insensitive) or equal; `nativeControlsInComponents` = JSX tags
  `button|input|select|textarea|table|a` (regex `<(button|input|select|textarea|table|a)[\s>/]`)
  in `web/app/components/**` and `web/app/(routes)/**` excluding `NextLink`;
  `dataAccessOutsideEntities` = files outside `web/app/entities` and
  `web/app/shared` importing `@app/shared/api`; `sameNameAcrossRoutes` =
  component basenames present in two route folders.
- knip: write `knip.json` into the app (`{ "entry": ["web/app/**/page.tsx", "web/app/**/layout.tsx", "web/app/api/**/route.ts", "web/e2e/**/*.ts"], "project": ["web/app/**/*.{ts,tsx}"] }`),
  run `pnpm exec knip --reporter json` → counts of `files`, `exports`,
  `dependencies`.
- Bundle: read both manifests after the build (step 48 builds first);
  per route sum `zlib.gzipSync(readFileSync('.next/' + chunk)).length` over
  the unique union of the route's chunks and `rootMainFiles`; KB with one
  decimal.
- Lines by origin: for every file in the ledger count lines by `origin`;
  template = lines of `web/app/**` files not in the ledger.

Write `benchmark/code.json`.

### Tests

`code.test.ts`: a temp folder with two near-identical 40-line components
→ the jscpd wrapper reports one clone; `nearNamed('Buton', inventory)`
finds `Button`; the native-control regex matches `<button` but not
`<Button`.

## Done when

```sh
tsx src/bench/code.ts <runId>
cat runs/<id>/benchmark/code.json
```

with a deliberately planted duplicate (copy a route's component into
another route) showing up under `clones` and `sameNameAcrossRoutes`.

## Watch out

- Run jscpd from the root's `node_modules` but with `cwd` in the app, so
  paths in the report are app-relative.
- Validate every `web/app` file, not only the route's: the benchmark is
  about the whole app.
