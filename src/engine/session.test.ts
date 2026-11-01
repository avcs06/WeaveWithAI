import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import type { StageContext } from '../agents/stages';
import { resolveBackend } from '../core/backends';
import { ConfigSchema } from '../core/env';
import type { Llm } from '../core/llm';
import { createRun, readEvents, runPath, totals } from '../core/run';
import { pathBeside } from '../core/utils';
import { museArgs, readUsage } from './muse';
import { type Check, runSession } from './session';
import { git, prepareApp } from './setup';

const root = mkdtempSync(path.join(tmpdir(), 'weave-engine-'));
afterAll(() => rmSync(root, { recursive: true, force: true }));
const idea = path.join(root, 'idea.md');
writeFileSync(idea, '<!-- test -->\n\nA reading list.\n');

const config = ConfigSchema.parse({
  MODEL_API_KEY: 'meta-key',
  BASETEN_API_KEY: 'baseten-key',
  BASETEN_MODEL: 'meta-models/muse-spark-open-1026',
  MODAL_BASE_URL: 'https://modal.example/v1',
  MODAL_PROXY_TOKEN: 'wk-1.ws-2',
  MODAL_MODEL: 'hackathon',
});
const fake = [process.execPath, pathBeside(import.meta.url, './__fixtures__/fake-muse.mjs')];

/** A run and an app folder prepared for Muse Code, with one file in its baseline. */
function setup(id: string) {
  const run = createRun({ idea, runsDir: root, id });
  const appDir = path.join(run.dir, 'app');
  git(path.dirname(appDir), 'init', '-q', 'app');
  writeFileSync(path.join(appDir, 'README.md'), 'app\n');
  prepareApp(appDir);
  const ctx: StageContext = { run, config, llm: {} as Llm, interactive: false, backend: 'meta' };
  return { run, appDir, ctx };
}

const checks =
  (failing: string[] = []) =>
  async (_appDir: string, name: string): Promise<Check> => ({ name, ok: !failing.includes(name), output: '' });

function withWrites<T>(writes: Record<string, string>, fn: () => Promise<T>): Promise<T> {
  process.env.FAKE_WRITES = JSON.stringify(writes);
  return fn().finally(() => delete process.env.FAKE_WRITES);
}

const page = 'web/app/(routes)/books/page.tsx';
const session = { id: 'page:S04', task: 'Build S04 from `.weave/screens/S04.json`.', inputs: { 'screens/S04.json': { id: 'S04' } }, route: '/books' };

describe('prepareApp', () => {
  it('writes the MCP and hook config and the hook, and commits a baseline', () => {
    const { appDir } = setup('prepare');
    const mcp = JSON.parse(readFileSync(path.join(appDir, '.mcp.json'), 'utf8'));
    expect(Object.keys(mcp.mcpServers)).toEqual(['weave-design-system']);
    const hooks = JSON.parse(readFileSync(path.join(appDir, '.muse/hooks.json'), 'utf8'));
    expect(hooks.hooks.PostToolUse[0].hooks[0].command).toBe('node .weave/hooks/validate-edit.mjs');
    expect(existsSync(path.join(appDir, '.weave/hooks/validate-edit.mjs'))).toBe(true);
    expect(git(appDir, 'status', '--porcelain')).toBe('');
  });
});

describe('runSession', () => {
  it('records usage and cost, the diff in the ledger, and commits a session that passes its gate', async () => {
    const { run, appDir, ctx } = setup('done');
    const result = await withWrites({ [page]: 'export default 1;\n' }, () =>
      runSession(ctx, appDir, session, { bin: fake, runCheck: checks() }),
    );
    expect(result.status).toBe('done');
    expect(result.summary).toBe('built it with key 8');
    expect(result.changed).toEqual([page]);
    expect(result.usage).toMatchObject({ calls: 3, input: 30000, cached: 20000, output: 1000 });
    expect(result.costUsd).toBeCloseTo((10000 * 1.25 + 20000 * 0.15 + 1000 * 4.25) / 1e6);
    expect(result.checks.map((c) => c.name)).toEqual(['validate', 'typecheck', 'lint', 'verify']);
    const ledger = JSON.parse(readFileSync(path.join(appDir, '.weave/ledger.json'), 'utf8'));
    expect(ledger).toEqual([{ status: 'A', path: page, origin: 'model', session: 'page:S04' }]);
    expect(readFileSync(path.join(appDir, '.weave/screens/S04.json'), 'utf8')).toContain('"S04"');
    expect(git(appDir, 'status', '--porcelain')).toBe('');
    expect(totals(run).calls).toBe(3);
    // The inputs and the session are a commit each, named for the stage; only the session's touches the app, so only it is a patch.
    expect(git(appDir, 'log', '-2', '--format=%s')).toBe('session: page:S04\nsession: inputs for page:S04');
    expect(readdirSync(runPath(run, 'patches', 'session'))).toEqual(['001-page-S04.patch']);
    expect(readEvents(run).map((e) => e.type)).toEqual(['session:start', 'llm:call', 'session:end']);
  });

  it('runs a Meta session on the subscription with no key, and counts its tokens but no spend', async () => {
    const { run, appDir, ctx } = setup('subscription');
    const result = await withWrites({ [page]: 'export default 1;\n' }, () =>
      runSession({ ...ctx, config: { ...config, MUSE_AUTH: 'subscription' } }, appDir, session, { bin: fake, runCheck: checks() }),
    );
    expect(result.summary).toBe('no key');
    expect(result.costUsd).toBe(0);
    expect(readEvents(run).find((e) => e.type === 'llm:call')).toMatchObject({ input: 30000, costUsd: 0, billing: 'subscription' });
    expect(totals(run)).toMatchObject({ calls: 3, costUsd: 0 });
  });

  it('fails a session whose diff touches a test or a protected path', async () => {
    const { appDir, ctx } = setup('protected');
    const result = await withWrites(
      { [page]: 'x\n', 'web/app/(routes)/books/page.test.tsx': 'x\n', 'packages/ui/x.ts': 'x\n' },
      () => runSession(ctx, appDir, session, { bin: fake, runCheck: checks() }),
    );
    expect(result.status).toBe('protected');
    expect(result.protectedHits.sort()).toEqual(['packages/ui/x.ts', 'web/app/(routes)/books/page.test.tsx']);
    // Committed anyway, so the next session starts clean and the hit is there to review.
    expect(git(appDir, 'status', '--porcelain')).toBe('');
    expect(git(appDir, 'log', '-1', '--format=%s')).toBe('session: page:S04 (protected)');
  });

  it('fails a session whose gate fails, whatever the agent says', async () => {
    const { appDir, ctx } = setup('checks');
    const result = await withWrites({ [page]: 'x\n' }, () =>
      runSession(ctx, appDir, session, { bin: fake, runCheck: checks(['typecheck']) }),
    );
    expect(result.status).toBe('checks');
    expect(result.checks.find((c) => c.name === 'typecheck')?.ok).toBe(false);
  });

  it('fails a session that reinstalls the packages, and puts them back from the lockfile before the checks', async () => {
    const { appDir, ctx } = setup('install');
    mkdirSync(path.join(appDir, 'node_modules'), { recursive: true });
    writeFileSync(path.join(appDir, 'node_modules/.modules.yaml'), 'packageManager: pnpm@10.20.0\n');
    const ran: string[] = [];
    const runCheck = async (_dir: string, name: string, args: string[]): Promise<Check> => {
      ran.push(`${name}: ${args.join(' ')}`);
      return { name, ok: true, output: '' };
    };
    const result = await withWrites({ [page]: 'x\n', 'node_modules/.modules.yaml': 'packageManager: pnpm@12.16.1\n' }, () =>
      runSession(ctx, appDir, session, { bin: fake, runCheck }),
    );
    expect(result.status).toBe('checks');
    expect(result.checks.find((c) => c.name === 'install')?.ok).toBe(false);
    expect(ran[0]).toBe('restore: env CI=true pnpm install --frozen-lockfile --prefer-offline');
    expect(ran.slice(1).map((line) => line.split(':')[0])).toEqual(['validate', 'typecheck', 'lint', 'verify']);
  });

  it('fails a session whose page misses a node of its design', async () => {
    const { appDir, ctx } = setup('design');
    const expectations = { folder: 'web/app/(routes)/books', testIds: ['S04.n01', 'S04.n02'], operations: ['listBooks'] };
    const result = await withWrites({ [page]: '<h1 data-testid="S04.n01" />; listBooks();\n' }, () =>
      runSession(ctx, appDir, { ...session, expect: expectations }, { bin: fake, runCheck: checks() }),
    );
    expect(result.status).toBe('checks');
    expect(result.checks.at(-1)).toEqual({ name: 'design', ok: false, output: 'No element has data-testid "S04.n02".' });
  });
});

describe('museArgs and readUsage', () => {
  it('pins the model, turns contributor mode off and trusts the workspace on every backend', () => {
    const opts = { promptFile: '.weave/tasks/x.md', maxSteps: 60, effort: 'medium' };
    const meta = museArgs(resolveBackend(config, 'meta'), opts);
    expect(meta).toEqual(expect.arrayContaining(['--trust-workspace', '--api-key-stdin', '--model', 'muse-spark-1.3']));
    expect(meta.join(' ')).toContain('--contributor-mode off');
    expect(meta).toEqual(
      expect.arrayContaining(['--disable-reminders', '--disable-web-tools', '--disable-request-user-input', '--no-foreign-personal-context']),
    );
    expect(meta).not.toContain('-c');
    const baseten = museArgs(resolveBackend(config, 'baseten'), opts);
    expect(baseten.at(-1)).toBe('endpoint_transport={"base_url":"https://inference.baseten.co/v1","auth":"bearer"}');
    expect(baseten).toContain('meta-models/muse-spark-open-1026');
    const modal = museArgs(resolveBackend(config, 'modal'), opts);
    expect(modal.at(-1)).toContain('"base_url":"https://modal.example/v1"');
    expect(museArgs(resolveBackend(config, 'meta'), { ...opts, subscription: true })).not.toContain('--api-key-stdin');
    expect(museArgs(resolveBackend(config, 'meta'), { ...opts, sessionId: 'u-1' }).join(' ')).toContain('--session-id u-1');
    expect(meta).not.toContain('--session-id');
  });

  it('reads a failed run as not completed, with its message', () => {
    const usage = readUsage('{"payload_type":"run.terminal.failed","payload":{"reason":"API error 401"}}\nnot json\n');
    expect(usage).toMatchObject({ completed: false, summary: 'API error 401', calls: 0 });
  });

  it("counts the side agents Muse leaves out of its totals", () => {
    const event = (payload_type: string, payload: unknown) => JSON.stringify({ payload_type, payload });
    const usage = readUsage(
      [
        event('task.lifecycle.proposed', { event: { kind: 'proposed', task_kind: 'reminder.agent.skill-reminder' } }),
        event('task.lifecycle.proposed', { event: { kind: 'proposed', task_kind: 'model.meta.response' } }),
        event('task.lifecycle.proposed', { event: { kind: 'proposed', task_kind: 'tool.bash' } }),
        event('run.usage', { children_included: false, models: [{ model: 'muse-spark-1.3', calls: 1, input_tokens: 10, cached_tokens: 0, output_tokens: 1 }] }),
      ].join('\n'),
    );
    expect(usage).toMatchObject({ childrenIncluded: false, children: 1, calls: 1 });
  });
});
