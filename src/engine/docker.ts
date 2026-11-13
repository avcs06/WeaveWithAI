import { createHash } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { execa, execaSync } from 'execa';

// The coding agent's sandbox: Claude Code runs in a container that sees only
// the app, from the host's own install mounted read-only.

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

/** The file an installed `claude` runs: the native build's versioned binary, or the npm build's script. */
export function agentBinary(bin: string): string {
  const found = bin.includes('/') ? bin : execaSync('which', [bin]).stdout.trim();
  return realpathSync(found);
}

export const IN_CONTAINER = { app: '/app', install: '/opt/claude', data: '/tmp/.claude' };

/**
 * `docker run` up to the image, then the binary: the app at /app, run as the user so files stay theirs.
 * The binary's folder is mounted, since an npm install's script needs the files beside it;
 * `data` keeps Claude Code's sessions between containers, so a fix session can continue the one before it;
 * `env` names variables passed on from the runner, whose values stay out of the arguments.
 */
export function dockerArgs(
  image: string,
  appDir: string,
  binary: string,
  opts: { data?: string; env?: string[] } = {},
): string[] {
  const { data, env = [] } = opts;
  const user = `${process.getuid?.() ?? 1000}:${process.getgid?.() ?? 1000}`;
  return [
    'run', '--rm', '-i',
    '--user', user,
    '-e', 'HOME=/tmp',
    // The agent's lint runs need no Nx daemon; one would only slow each command down.
    '-e', 'NX_DAEMON=false',
    ...env.flatMap((name) => ['-e', name]),
    '-v', `${path.resolve(appDir)}:${IN_CONTAINER.app}`,
    '-v', `${path.dirname(binary)}:${IN_CONTAINER.install}:ro`,
    ...(data ? ['-v', `${path.resolve(data)}:${IN_CONTAINER.data}`] : []),
    '-w', IN_CONTAINER.app,
    image,
    `${IN_CONTAINER.install}/${path.basename(binary)}`,
  ];
}
