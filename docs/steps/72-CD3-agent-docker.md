# 72 · CD3 The agent in Docker

Phase 6 · 2 h · Depends: CD1 · Decision: D9.1 A

## Goal

Muse Code runs inside a container that sees only the app, so the shell
commands of a headless agent with no approval prompt cannot reach the rest
of the machine. The scaffold sets it up; a session uses it.

## What this step does

1. **An image for the agent**: Node 22, pnpm, git, Playwright's Chromium
   (the agent runs `pnpm verify` itself) and the Muse Code launcher.
2. **The scaffold builds it when it is missing**, tagged with a hash of the
   Dockerfile, so a change rebuilds it and a rerun reuses it.
3. **A session runs `muse exec` in it**: the app mounted at `/app`, run as
   the user's uid and gid so files stay theirs, the API key on stdin,
   Muse's own sandbox off because the container is the sandbox.
4. **The host path stays.** `MUSE_DOCKER=0` runs Muse Code on the host as
   now; the tests use the fake `muse` on the host.

Cut this task first if time runs short: sessions work on the host.

## Before you start

- Docker 29.1.3 is installed (Ubuntu 22.04 on WSL, checked 2026-11-01).
- `muse` is a launcher script (`~/.local/bin/muse`) that downloads the Muse
  Code binary from Meta and updates it every hour
  (`MUSE_UPDATE_INTERVAL_SECONDS`). Sessions use `--api-key-stdin`, so no
  device login is needed.
- Muse's own sandbox needs bubblewrap (D9.1), which is not installed here.
  `muse exec --disable-sandbox` turns it off; `--trust-workspace` still
  loads `AGENTS.md`, `.mcp.json` and the hooks.
- Never rely on the user's global Muse settings: `museArgs` pins the model
  and contributor mode.

## Implementation details

```text
docker/agent.Dockerfile     node:22-bookworm, corepack pnpm, git, the Chromium that the
                            template's playwright-core uses (with its system deps), the Muse
                            launcher fetched at build time with updates off
```

```ts
// src/engine/docker.ts
export async function ensureAgentImage(): Promise<string>;   // 'weave-agent:<hash>', built when missing
export function dockerArgs(image: string, appDir: string): string[];   // run --rm -i --user uid:gid -v <app>:/app -w /app -e HOME=/tmp/home <image>
```

- `museArgs` adds `--disable-sandbox` when the session runs in the
  container. `runSession` prefixes the command with `docker` and
  `dockerArgs` when `MUSE_DOCKER` is not `0`.
- `MUSE_DOCKER` joins the config in `src/core/env.ts` and `.env.example`,
  default `1`.
- The checks after the session still run on the host, on the same folder.
- The agent's dev server listens on 3001 inside the container, so it does
  not collide with a dev server on the host.

## Tests

1. `dockerArgs` mounts the app, sets the uid and gid, and passes `-i`.
2. `museArgs` in the container adds `--disable-sandbox`.
3. `ensureAgentImage` builds only when the tag is missing (a fake `docker`).

## Done when

```sh
pnpm typecheck && pnpm test
docker build -f docker/agent.Dockerfile .
```

A fake `muse` mounted into the container edits the app and leaves the
files owned by the user. One real session in the container runs on the
user's go, since it spends credits.

## Watch out

- `node_modules` is installed on the host and used in the container: both
  are Linux x64, so native modules match. Keep the image's Node major the
  same as the host's.
- The launcher's binary cache must be writable in the image, or every run
  downloads it again.
