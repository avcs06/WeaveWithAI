import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { resolveBackend } from '../core/backends';
import { ConfigSchema } from '../core/env';
import { agentImage, dockerArgs, ensureAgentImage } from './docker';
import { museArgs } from './muse';

const root = mkdtempSync(path.join(tmpdir(), 'weave-docker-'));
afterAll(() => rmSync(root, { recursive: true, force: true }));

/** A `docker` that logs its arguments and finds an image only when FOUND is set. */
function fakeDocker(found: boolean): { bin: string; log: string } {
  const log = path.join(root, `${found}.log`);
  const bin = path.join(root, `docker-${found}`);
  writeFileSync(bin, `#!/bin/sh\necho "$@" >> ${log}\n[ "$1" = image ] && exit ${found ? 0 : 1}\nexit 0\n`);
  chmodSync(bin, 0o755);
  return { bin, log };
}

describe('the agent container', () => {
  it('mounts the app and Muse Code, runs as the user, and keeps stdin open for the key', () => {
    const args = dockerArgs('weave-agent:abc', 'runs/x/app', '/home/u/.local/bin');
    expect(args.slice(0, 3)).toEqual(['run', '--rm', '-i']);
    expect(args).toContain(`${process.getuid?.()}:${process.getgid?.()}`);
    expect(args).toContain(`${path.resolve('runs/x/app')}:/app`);
    expect(args).toContain('/home/u/.local/bin:/opt/muse:ro');
    expect(args.slice(-2)).toEqual(['weave-agent:abc', '/opt/muse/muse']);
    expect(args.join(' ')).not.toContain('.config/muse');
  });

  it('mounts the Muse login writable for the subscription', () => {
    const args = dockerArgs('weave-agent:abc', 'runs/x/app', '/home/u/.local/bin', '/home/u/.config/muse');
    expect(args).toContain('/home/u/.config/muse:/tmp/.config/muse');
  });

  it("turns Muse's own sandbox off only inside the container", () => {
    const backend = resolveBackend(ConfigSchema.parse({ MODEL_API_KEY: 'k' }), 'meta');
    const opts = { promptFile: '.weave/tasks/x.md', maxSteps: 60, effort: 'medium' };
    expect(museArgs(backend, { ...opts, inContainer: true })).toContain('--disable-sandbox');
    expect(museArgs(backend, opts)).not.toContain('--disable-sandbox');
  });

  it('builds the image only when its tag is missing', async () => {
    const missing = fakeDocker(false);
    expect(await ensureAgentImage(missing.bin)).toBe(agentImage());
    expect(readFileSync(missing.log, 'utf8')).toContain(`build -f docker/agent.Dockerfile -t ${agentImage()}`);
    const present = fakeDocker(true);
    await ensureAgentImage(present.bin);
    expect(readFileSync(present.log, 'utf8')).not.toContain('build');
  });
});
