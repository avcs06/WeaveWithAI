import { spawn } from 'node:child_process';

// The app's dev server for the rendered checks after a session. `pnpm verify`
// uses a server already on the port instead of starting its own.

export const APP_URL = 'http://localhost:3001';

const isUp = (url: string) =>
  fetch(url).then(
    () => true,
    () => false,
  );

/** Runs `fn` with the app's dev server up, starting it when nothing listens yet and stopping only what it started. */
export async function withDevServer<T>(appDir: string, fn: () => Promise<T>, timeoutMs = 120_000): Promise<T> {
  if (await isUp(APP_URL)) return fn();
  const server = spawn('pnpm', ['dev'], { cwd: appDir, detached: true, stdio: 'ignore' });
  const stop = () => {
    if (server.pid) process.kill(-server.pid);
  };
  try {
    for (let waited = 0; !(await isUp(APP_URL)); waited += 500) {
      if (waited > timeoutMs) throw new Error(`The dev server of ${appDir} did not start within ${timeoutMs / 1000} s.`);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return await fn();
  } finally {
    stop();
  }
}
