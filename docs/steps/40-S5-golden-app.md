# 40 · S5 Golden freelancer workspace to app

Phase 6 · 45 min · Depends: S4 · Gate G5

## Goal

The whole of Phase 6 on the golden freelancer workspace, end to end, with the
app building in production mode and the first numbers recorded.

## What this step does

1. **Run Phase 6 end to end** on the golden freelancer workspace from a clean
   app folder.
2. **Run every app check and a production build**; note timings and sizes.
3. **Fix generator bugs** found on the way and rerun from scaffold.
4. **Record the numbers** in the golden README.

After this step gate G5 is met: a themed app with a working mock API comes
out of a frozen spec by code alone.

## Implementation details

1. `rm -rf runs/<id>/app` (if an earlier scaffold exists), then
   `pnpm weave run fixtures/ideas/freelancer-workspace.md --run <id> --to apitest`.
2. In the app: `pnpm typecheck`, `pnpm nx lint web`, `pnpm nx test web`,
   `pnpm build` (`next build web --webpack`). Note the build time and the
   "First Load JS" table it prints.
3. Fix codegen bugs found on the way in the generator (steps 36 to 39);
   rerun from `--from scaffold` after deleting the app folder.
4. Record in `fixtures/golden/README.md` under a "Generated app" heading:
   scaffold time, install time, build time, test count, first-load JS of
   the starter route.

## Done when

Gate **G5**: the freelancer workspace scaffolds and themes from the frozen spec;
`web/app/entities/*` and `web/app/api/**` exist from the contract; the
contract tests pass against the mock; `pnpm build` succeeds.
