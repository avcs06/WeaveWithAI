import { createHash } from 'node:crypto';
import { cpSync, existsSync, readFileSync, realpathSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execa, execaSync } from 'execa';
import type { AgentName } from '../core/backends';

// The coding agent's sandbox: Muse Code or OpenCode runs in a container that
// sees only the app, from the host's own install mounted read-only.

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

/**
 * Removes the agent's images and any container left from them: every tag but the current Dockerfile's, or with
 * `all` that one too, as when the work is done. Returns the tags it removed.
 */
export async function cleanAgentImages(opts: { all?: boolean } = {}, docker = 'docker'): Promise<string[]> {
  const current = agentImage();
  const listed = await execa(docker, ['images', 'weave-agent', '--format', '{{.Repository}}:{{.Tag}}']);
  const tags = listed.stdout.split('\n').filter((tag) => tag && (opts.all || tag !== current));
  for (const tag of tags) {
    const containers = (await execa(docker, ['ps', '-aq', '--filter', `ancestor=${tag}`])).stdout.split('\n').filter(Boolean);
    if (containers.length) await execa(docker, ['rm', '-f', ...containers]);
  }
  if (tags.length) await execa(docker, ['rmi', ...tags]);
  return tags;
}

/**
 * Copies the model catalog the host's Muse Code cached from the Meta API into a run's Muse data folder. An
 * open-weight endpoint serves no catalog, so Muse with a new data folder fails before its first call without one.
 */
export function seedModelCatalog(data: string, home = os.homedir()): void {
  const to = path.join(data, 'model-catalog');
  if (existsSync(to)) return;
  const from = path.join(home, '.local', 'share', 'muse', 'model-catalog');
  if (!existsSync(from))
    throw new Error(`Muse Code has no model catalog at ${from}. Run muse once signed in to the Meta API, which caches it, then run again.`);
  cpSync(from, to, { recursive: true });
}

/** The folder a coding agent is installed in: its launcher's, with the binary beside it. */
export function agentDir(bin: string): string {
  const found = bin.includes('/') ? bin : execaSync('which', [bin]).stdout.trim();
  return path.dirname(realpathSync(found));
}

/** Where each agent's install and its data sit in the container. */
export const IN_CONTAINER = {
  app: '/app',
  muse: { dir: '/opt/muse', bin: '/opt/muse/muse', data: '/tmp/.local/share/muse' },
  opencode: { dir: '/opt/opencode', bin: '/opt/opencode/opencode', data: '/tmp/.local/share/opencode' },
};

/**
 * `docker run` up to the image, then the launcher: the app at /app, run as the user so files stay theirs.
 * `login` mounts the host's Muse login for the subscription, writable so Muse can refresh its token;
 * `data` keeps the agent's sessions between containers, so a fix session can continue the one before it;
 * `env` names variables passed on from the runner, whose values stay out of the arguments.
 */
export function dockerArgs(
  image: string,
  appDir: string,
  installed: string,
  opts: { agent?: AgentName; login?: string; data?: string; env?: string[] } = {},
): string[] {
  const { login, data, env = [] } = opts;
  const agent = IN_CONTAINER[opts.agent ?? 'muse'];
  const user = `${process.getuid?.() ?? 1000}:${process.getgid?.() ?? 1000}`;
  return [
    'run', '--rm', '-i',
    '--user', user,
    '-e', 'HOME=/tmp',
    // The agent's lint runs need no Nx daemon; one would only slow each command down.
    '-e', 'NX_DAEMON=false',
    ...env.flatMap((name) => ['-e', name]),
    '-v', `${path.resolve(appDir)}:${IN_CONTAINER.app}`,
    '-v', `${installed}:${agent.dir}:ro`,
    ...(login ? ['-v', `${login}:/tmp/.config/muse`] : []),
    ...(data ? ['-v', `${path.resolve(data)}:${agent.data}`] : []),
    '-w', IN_CONTAINER.app,
    image,
    agent.bin,
  ];
}
