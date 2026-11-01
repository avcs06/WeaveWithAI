import { createHash } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { execa, execaSync } from 'execa';

// The coding agent's sandbox (CD3): Muse Code runs in a container that sees
// only the app, from the host's own install mounted read-only.

const DOCKERFILE = 'docker/agent.Dockerfile';

/** The image tag: a hash of the Dockerfile, so a change builds a new image and a rerun reuses it. */
export function agentImage(dockerfile = DOCKERFILE): string {
  const hash = createHash('sha256').update(readFileSync(dockerfile)).digest('hex').slice(0, 12);
  return `weave-agent:${hash}`;
}

/** Builds the agent image when no image has its tag; returns the tag. */
export async function ensureAgentImage(docker = 'docker'): Promise<string> {
  const image = agentImage();
  const found = await execa(docker, ['image', 'inspect', image], { reject: false });
  if (found.exitCode !== 0)
    await execa(docker, ['build', '-f', DOCKERFILE, '-t', image, path.dirname(DOCKERFILE)], { stdio: 'inherit' });
  return image;
}

/** The folder Muse Code is installed in: its launcher's, with the binary beside it. */
export function museDir(bin: string): string {
  const found = bin.includes('/') ? bin : execaSync('which', [bin]).stdout.trim();
  return path.dirname(realpathSync(found));
}

/**
 * `docker run` up to the image, then the launcher: the app at /app, run as the user so files stay theirs.
 * `login` mounts the host's Muse login for the subscription, writable so Muse can refresh its token;
 * `data` keeps Muse's sessions between containers, so a fix session can continue the one before it.
 */
export function dockerArgs(image: string, appDir: string, muse: string, mounts: { login?: string; data?: string } = {}): string[] {
  const { login, data } = mounts;
  const user = `${process.getuid?.() ?? 1000}:${process.getgid?.() ?? 1000}`;
  return [
    'run', '--rm', '-i',
    '--user', user,
    '-e', 'HOME=/tmp',
    '-v', `${path.resolve(appDir)}:/app`,
    '-v', `${muse}:/opt/muse:ro`,
    ...(login ? ['-v', `${login}:/tmp/.config/muse`] : []),
    ...(data ? ['-v', `${path.resolve(data)}:/tmp/.local/share/muse`] : []),
    '-w', '/app',
    image,
    '/opt/muse/muse',
  ];
}
