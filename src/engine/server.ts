import { spawn, spawnSync } from 'node:child_process';
import { readlinkSync, realpathSync } from 'node:fs';

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
 * Stops a dev server on the app's port that serves another folder, such as an earlier run's app since deleted:
 * the checks use whatever answers there, and would check that app instead of this one.
 */
export async function freeAppPort(appDir: string): Promise<void> {
  const own = realpathSync(appDir);
  // lsof misses the listener under WSL; ss names it: users:(("next-server",pid=209018,fd=22)).
  const listening = () =>
    [...(spawnSync('ss', ['-Hltnp', `sport = :${new URL(APP_URL).port}`], { encoding: 'utf8' }).stdout ?? '').matchAll(/pid=(\d+)/g)].map(
      (match) => match[1] ?? '',
    );
  const stopped: string[] = [];
  for (const pid of listening()) {
    let cwd = '';
    try {
      cwd = readlinkSync(`/proc/${pid}/cwd`);
    } catch {
      continue;
    }
    if (cwd === own || cwd.startsWith(`${own}/`)) continue;
    const group = Number(spawnSync('ps', ['-o', 'pgid=', '-p', pid], { encoding: 'utf8' }).stdout.trim());
    if (group > 0) {
      process.kill(-group, 'SIGTERM');
      stopped.push(pid);
    }
  }
  // Until the old server has exited it still answers on the port, and the checks would reach it.
  for (let waited = 0; stopped.some((pid) => listening().includes(pid)) && waited < 10_000; waited += 500) await wait();
}

/**
 * Runs `fn` with the app's dev server up, starting it when nothing listens yet and stopping only what it started.
 * `firstUrl` is the route `fn` opens first, warmed up before it.
 */
export async function withDevServer<T>(appDir: string, fn: () => Promise<T>, firstUrl = APP_URL, timeoutMs = 120_000): Promise<T> {
  await freeAppPort(appDir);
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
