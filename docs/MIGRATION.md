# Migration: one repo for the agent, the template and the MCP

Decision D0.1 A. Runs once, on the `hackathon` branch. The script was tested
on a copy of `avcs06/weave-design-system` (`master` at `185e291`) on
2026-10-28; `hackathon` is ahead of that, so the findings below may already
be fixed there.

## Target layout

```text
<repo>/
  AGENTS.md  CLAUDE.md  README.md  package.json  vitest.config.ts  .env.example
  docs/  fixtures/  src/  scripts/        the generator agent
  mcp/                                    weave-design-system-mcp (was template/tools/weave-design-system-mcp)
  template/                               everything that was at the root before
    tools/weave-design-system-mcp -> ../../mcp   symlink, so template scripts work unchanged
```

`template/` stays a standalone pnpm/Nx workspace with its own lockfile, so
`generate.mjs` (and later the agent's scaffold step) can copy it as-is. Don't
add it to a root workspace.

## Run it

1. Commit the design-system components you just finished on `hackathon`; the
   script refuses a dirty working tree. Push if you want a backup.
2. Unzip the kit somewhere outside the repository, then:

   ```sh
   bash ~/weave-kickoff/scripts/migrate-repo.sh ~/code/weave-design-system --clean
   ```

   It checks out `hackathon` first (`--base <branch>` for another) and checks
   everything it needs before changing anything. `--clean` deletes
   regenerable root folders first (`node_modules`, `.nx`, `dist`, `tmp`,
   `coverage`, the MCP's `node_modules` and `dist`); they're reinstalled in
   step 3. `--no-kit` restructures only; `--no-commit` leaves everything staged.
   If `tools/generate.mjs` on your branch differs from the tested version, its
   two small patches skip themselves with a warning saying what to do by hand.

3. Verify:

   ```sh
   cd template
   pnpm install --frozen-lockfile
   pnpm mcp:setup          # builds the MCP through the symlink into ../mcp/dist
   pnpm mcp:check          # "MCP configuration loaded: N components, M tokens"
   pnpm typecheck
   node --test tools/generate.test.mjs
   node tools/export-design-system.mjs | head -c 300
   cd ..
   ```

The script works on a new branch, `restructure/agent-root`, cut from
`hackathon`, in two commits:

1. **Move**: every tracked top-level entry into `template/` with `git mv`
   (history follows with `git log --follow`), the MCP to `mcp/`, the symlink,
   `generate.mjs` set to copy through the symlink (`dereference: true`), and
   root `.gitignore`, `.mcp.json`, `.vscode/mcp.json`, `LICENSE`.
2. **Kit**: these docs, `AGENTS.md`, `CLAUDE.md`, root `package.json`,
   `vitest.config.ts`, `.env.example`, `src/` prompts and `src/tsconfig.json`,
   `fixtures/`, plus `template/tools/export-design-system.mjs` and the
   `generate.mjs` EEXIST fix described below.

Merge when the checks pass: `git checkout hackathon && git merge --ff-only restructure/agent-root`.
Undo instead: `git checkout hackathon && git branch -D restructure/agent-root`.

## What was verified on the copy (`master`)

| Check                                                       | Result                                                    |
| ----------------------------------------------------------- | --------------------------------------------------------- |
| `git status` after the move                                 | clean; `mcp/node_modules` and `mcp/dist` ignored by root  |
| `pnpm install --frozen-lockfile` in `template/`             | passes (41 s)                                             |
| `pnpm mcp:setup` through the symlink                        | builds into `mcp/dist`                                    |
| `pnpm mcp:check`                                            | 63 entries, 227 tokens                                    |
| ESLint with the MCP-backed plugin, through the symlink      | passes                                                    |
| `node tools/generate.mjs . ../out --include-server --skip-setup` | the app gets a real `tools/weave-design-system-mcp` directory, without `node_modules` or `dist` |
| `export-design-system.mjs` run from another folder          | 43 UI components, 29 recipes, 227 tokens, about 60 KB of JSON |

## Found on the way (on `master`; not caused by the move)

1. **`pnpm typecheck` fails on the pushed commit:**
   `packages/ui/src/Tooltip/auxiliary.tsx` imports `@radix-ui/react-popper`,
   which is only a transitive dependency, and pnpm's strict layout hides it.
   If it fails on your machine too: `pnpm --dir template add @radix-ui/react-popper`.
2. **`generate.test.mjs`: 5 of 8 tests fail on Node 22.23.4, before and after
   the move.** `generate.mjs` creates the target folder, then calls `cp` with
   `errorOnExist`, which newer Node versions reject with `ERR_FS_CP_EEXIST`.
   The kit commit replaces the `mkdir(target)` with creating the parent and
   removing the empty target (`rmdir` only removes an empty folder); all 8
   tests pass after. `mcp/.nvmrc` pins Node 24.11; use it if you can.
3. **`template/.gitignore` ignores `.agents`, `.github`, `.opencode`, `.codex`
   and `/docs/`.** After the move these patterns apply only inside
   `template/`, so the root can hold `docs/` and, later, `.agents/skills/` and
   `.github/workflows/`. If you want generated apps to ship CI workflows or
   skills, remove those lines from `template/.gitignore` in Phase 6.
4. **The inventory needs the template's own folder as working directory.**
   Loading it from the root fails inside `ts-node`. `export-design-system.mjs`
   changes directory itself, so the agent runs it as a child process and
   caches the JSON (loading takes about 7 seconds).
5. **No `tsconfig.json` at the repo root.** The template's `ts-node` (used
   when its Tailwind and token files load) searches upward for a
   `tsconfig.json`; finding the agent's made `pnpm mcp:check` fail with
   TS5011 and TS5107 in testing. The agent's config lives in
   `src/tsconfig.json` (`pnpm typecheck` runs `tsc -p src`).
6. **The MCP inventory lists hooks and prop types too** (`useIconAddon`,
   `TableMode`, `ControlProps`). The exporter keeps PascalCase names not ending
   in `Props`, `Value`, `Mode`, `Width` or `Variants`.

## Manual steps instead of the script

```sh
git checkout hackathon && git checkout -b restructure/agent-root
mkdir template
git ls-tree --name-only HEAD | while IFS= read -r e; do git mv -- "$e" "template/$e"; done
git mv template/tools/weave-design-system-mcp mcp
ln -s ../../mcp template/tools/weave-design-system-mcp && git add template/tools/weave-design-system-mcp
# in template/tools/generate.mjs, add `dereference: true,` to the cp() options
# write root .gitignore (must ignore node_modules and dist everywhere), .mcp.json, .vscode/mcp.json
git commit -m "Move the design system into template/ and the MCP into mcp/"
```

## Symlink caveat

Git stores the symlink natively. It works on Linux, macOS and WSL. A checkout
on native Windows without symlink support turns it into a text file; anyone
building there needs Developer Mode or `git config core.symlinks true`.
