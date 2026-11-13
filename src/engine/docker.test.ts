import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { agentImage, cleanAgentImages, dockerArgs, ensureAgentImage } from './docker';

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
  it("mounts the app and Claude Code's install folder, runs as the user, and runs the binary by its own name", () => {
    const binary = '/home/u/.local/share/claude/versions/2.1.301';
    const args = dockerArgs('weave-agent:abc', 'runs/x/app', binary);
    expect(args.slice(0, 3)).toEqual(['run', '--rm', '-i']);
    expect(args).toContain(`${process.getuid?.()}:${process.getgid?.()}`);
    expect(args).toContain(`${path.resolve('runs/x/app')}:/app`);
    expect(args).toContain('/home/u/.local/share/claude/versions:/opt/claude:ro');
    expect(args.join(' ')).toContain('-e NX_DAEMON=false');
    expect(args.slice(-2)).toEqual(['weave-agent:abc', '/opt/claude/2.1.301']);
  });

  it("mounts the run's Claude Code sessions so a fix can continue one, and passes named variables on without their values", () => {
    const args = dockerArgs('weave-agent:abc', 'runs/x/app', '/opt/x/claude', { data: 'runs/x/claude', env: ['ANTHROPIC_API_KEY'] });
    expect(args).toContain(`${path.resolve('runs/x/claude')}:/tmp/.claude`);
    expect(args.join(' ')).toContain('-e ANTHROPIC_API_KEY -v');
  });

  it("removes the agent's old images, and with all the current one too", async () => {
    const log = path.join(root, 'clean.log');
    const bin = path.join(root, 'docker-clean');
    const tags = ['weave-agent:old1', agentImage(), 'weave-agent:dev'].join('\\n');
    writeFileSync(bin, `#!/bin/sh\necho "$@" >> ${log}\n[ "$1" = images ] && printf '${tags}\\n'\nexit 0\n`);
    chmodSync(bin, 0o755);
    expect(await cleanAgentImages({}, bin)).toEqual(['weave-agent:old1', 'weave-agent:dev']);
    expect(readFileSync(log, 'utf8')).toContain('rmi weave-agent:old1 weave-agent:dev');
    expect(await cleanAgentImages({ all: true }, bin)).toEqual(['weave-agent:old1', agentImage(), 'weave-agent:dev']);
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
