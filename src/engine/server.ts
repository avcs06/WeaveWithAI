import { spawn } from 'node:child_process';

// The app's dev server for the rendered checks after a session. `pnpm verify`
// uses a server already on the port instead of starting its own.

export const APP_URL = 'http://localhost:3001';

/** The server's status for `url`: 0 while nothing answers. */
const status = (url: string) =>
  fetch(url).then(
    (response) => response.status,
    () => 0,
  );
const wait = () => new Promise((resolve) => setTimeout(resolve, 500));

/**
 * Waits until the server answers `url` with something other than a 5xx: Next's first compile of a route can
 * answer 500 while it writes its manifests, and a page opened then fails for nothing. A 5xx that lasts is the
 * app's own, so after `capMs` the checks go on and report it.
 */
export async function warmUp(url: string, capMs = 30_000): Promise<void> {
  for (let waited = 0; (await status(url)) >= 500 && waited < capMs; waited += 500) await wait();
}

/**
 * Runs `fn` with the app's dev server up, starting it when nothing listens yet and stopping only what it started.
 * `firstUrl` is the route `fn` opens first, warmed up before it.
 */
export async function withDevServer<T>(appDir: string, fn: () => Promise<T>, firstUrl = APP_URL, timeoutMs = 120_000): Promise<T> {
  if (await status(APP_URL)) {
    await warmUp(firstUrl);
    return fn();
  }
  const server = spawn('pnpm', ['dev'], { cwd: appDir, detached: true, stdio: 'ignore' });
  const stop = () => {
    if (server.pid) process.kill(-server.pid);
  };
  try {
    for (let waited = 0; !(await status(APP_URL)); waited += 500) {
      if (waited > timeoutMs) throw new Error(`The dev server of ${appDir} did not start within ${timeoutMs / 1000} s.`);
      await wait();
    }
    await warmUp(firstUrl);
    return await fn();
  } finally {
    stop();
  }
}
