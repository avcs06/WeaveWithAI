# 48 · B1 Production build and server

Phase 8 · 45 min · Depends: S5 · Decisions: D13.2 A, D13.5 A

## Goal

The app measured as it would ship: a production build served by Next's
server with gzip, ETags, immutable static caching and security headers,
on a fresh seeded store, started and stopped by the benchmark runner.

## What this step does

1. **Measure the app as it would ship**: a production build, served by
   Next's own server, which gzips responses, sends ETags and marks static
   files immutable; the template gains the standard security headers.
2. **The benchmark runner starts and stops that server** on a free port with
   a fresh seeded store and zero artificial latency, and asserts the
   compression and caching headers before measuring anything.
3. **A slow test** proves build, start, assertions and stop.

After this step every later benchmark number is measured on a real
production server, not the dev server.

## Before you start

- `next build web --webpack` is the template's `pnpm build`; `next start
  web --port <p>` serves it. Next compresses responses with gzip by default
  (`compress: true`) and sends `Cache-Control: public, max-age=31536000,
  immutable` for `/_next/static/*` and ETags for pages.
- Brotli is not something Next's server does; the doc says what is
  measured (gzip). A proxy with Brotli is D13.2 B, not this week.

## Implementation details

### 1. Template: `web/next.config.js`

Add to `nextConfig`:

```js
compress: true,
poweredByHeader: false,
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'X-Frame-Options', value: 'DENY' },
    ],
  }];
},
```

No Content-Security-Policy this week (nonces with vanilla-extract and
Next need a day); Lighthouse's best-practices audit will note it.

### 2. `src/bench/server.ts`

```ts
export async function buildApp(run: Run): Promise<{ durationMs: number; log: string }>;   // pnpm build in the app, log to benchmark/build.log
export async function startProdServer(run: Run, opts?: { port?: number }): Promise<{ baseUrl: string; port: number; dbPath: string; stop: () => Promise<void> }>;
export async function assertServing(baseUrl: string): Promise<{ gzip: boolean; etag: boolean; immutableStatic: boolean; headers: Record<string, string> }>;
```

`startProdServer`: free port via `net.createServer().listen(0)`; copy
`web/mocks/seed.json` to `benchmark/db.json` and set `MOCK_DB_PATH` to it,
`MOCK_LATENCY_MS=0`, `NODE_ENV=production`; `execa('pnpm', ['exec', 'next',
'start', 'web', '--port', port], { cwd: appDir, env })`; poll `GET /` until
200 (up to 60 s); `stop` kills the process group. `assertServing`: fetch `/`
with `Accept-Encoding: gzip` and read `content-encoding`, `etag`; parse one
`/_next/static/` URL from the HTML and check its `cache-control` contains
`immutable`. Record everything in `benchmark/server.json`.

### 3. Tests

`server.test.ts` is skipped unless `WEAVE_BENCH_APP=<appDir>` is set
(slow): build, start, `assertServing` all true, stop.

## Done when

```sh
WEAVE_BENCH_APP=runs/<id>/app pnpm test -- src/bench/server.test.ts
```

prints `gzip: true, etag: true, immutableStatic: true`.

## Watch out

- The bench store is a copy; the dev store `web/mocks/db.json` is untouched.
- Stop the server in a `finally`; an orphaned `next start` holds the port.
