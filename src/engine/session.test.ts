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
import { appCheck, type Check, resumeSession, runSession } from './session';
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
const session = { id: 'pages', task: 'Build S04 from `.weave/04-pages/S04.md`.', routes: [{ url: '/books', signedIn: false }] };

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
    expect(ledger).toEqual([{ status: 'A', path: page, origin: 'model', session: 'pages' }]);
    expect(git(appDir, 'status', '--porcelain')).toBe('');
    expect(totals(run).calls).toBe(3);
    // The inputs and the session are a commit each, named for the stage; only the session's touches the app, so only it is a patch.
    expect(git(appDir, 'log', '-2', '--format=%s')).toBe('session: pages\nsession: inputs for pages');
    expect(readdirSync(runPath(run, 'patches', 'session'))).toEqual(['001-pages.patch']);
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

  it('runs pnpm verify at the desktop width, signed in as a member on a route behind sign-in', async () => {
    const { appDir, ctx } = setup('signed-in');
    const ran: string[] = [];
    const runCheck = async (_dir: string, name: string, args: string[]): Promise<Check> => {
      ran.push(args.join(' '));
      return { name, ok: true, output: '' };
    };
    const routes = [
      { url: '/', signedIn: false },
      { url: '/books', signedIn: true },
      { url: '/books/b-1', signedIn: true },
    ];
    await withWrites({ [page]: 'x\n' }, () => runSession(ctx, appDir, { ...session, routes }, { bin: fake, runCheck }));
    // One call for the visitor's routes, one for the member's.
    expect(ran.filter((line) => line.startsWith('pnpm verify'))).toEqual([
      'pnpm verify / --widths 1280',
      'pnpm verify /books /books/b-1 --widths 1280 --storage .weave/02-contract/signed-in.json',
    ]);
  });

  it("leaves pnpm's engine warnings out of a check's output", async () => {
    const { appDir } = setup('engine-warn');
    const script = "console.log(' WARN  Unsupported engine: wanted node >=24.11.0'); console.log('Type error in page.tsx'); process.exit(1)";
    expect(await appCheck(appDir, 'typecheck', ['node', '-e', script])).toEqual({ name: 'typecheck', ok: false, output: 'Type error in page.tsx' });
  });

  it('fails a session whose diff touches a test or a protected path', async () => {
    const { appDir, ctx } = setup('protected');
    const result = await withWrites(
      { [page]: 'x\n', 'web/app/(routes)/books/page.test.tsx': 'x\n', 'tools/x.mjs': 'x\n' },
      () => runSession(ctx, appDir, session, { bin: fake, runCheck: checks() }),
    );
    expect(result.status).toBe('protected');
    expect(result.protectedHits.sort()).toEqual(['tools/x.mjs', 'web/app/(routes)/books/page.test.tsx']);
    // Committed anyway, so the next session starts clean and the hit is there to review.
    expect(git(appDir, 'status', '--porcelain')).toBe('');
    expect(git(appDir, 'log', '-1', '--format=%s')).toBe('session: pages (protected)');
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

  it('fails a session whose page does not load what its screen shows', async () => {
    const { appDir, ctx } = setup('design');
    const expectations = { folder: 'web/app/(routes)/books', operations: ['listBooks', 'listShelves'] };
    const result = await withWrites({ [page]: '<h1>Reading list</h1>; listBooks();\n' }, () =>
      runSession(ctx, appDir, { ...session, expects: [expectations] }, { bin: fake, runCheck: checks() }),
    );
    expect(result.status).toBe('checks');
    expect(result.checks.at(-1)).toEqual({
      name: 'design',
      ok: false,
      output: "Nothing in web/app/(routes)/books or the blocks it imports calls listShelves; load the screen's records through it.",
    });
  });
});

describe('resumeSession', () => {
  it("continues the cut Muse session by its id, and counts the cut session's uncommitted files as its own", async () => {
    const { run, appDir, ctx } = setup('resume');
    const museSession = '6fc17888-93c9-445e-a984-940be5c78d23';
    // What the cut session wrote before the run was killed: in the app, never committed.
    const cut = 'web/app/(routes)/shelves/page.tsx';
    mkdirSync(path.join(appDir, path.dirname(cut)), { recursive: true });
    writeFileSync(path.join(appDir, cut), 'export default 2;\n');
    process.env.FAKE_ARGS = runPath(run, 'muse-args.log');
    const result = await withWrites({ [page]: 'export default 1;\n' }, () =>
      resumeSession(ctx, appDir, { ...session, id: 'pages-resume', museSession }, { bin: fake, runCheck: checks() }),
    ).finally(() => delete process.env.FAKE_ARGS);

    expect(readFileSync(runPath(run, 'muse-args.log'), 'utf8')).toContain(`--session-id ${museSession}`);
    expect(result.status).toBe('done');
    expect(result.changed.sort()).toEqual([page, cut]);
    // The inputs commit holds the task alone; the session's commit holds both pages.
    expect(git(appDir, 'show', '--name-only', '--format=', 'HEAD~1').trim()).toBe('.weave/tasks/pages-resume.md');
    expect(git(appDir, 'show', '--name-only', '--format=', 'HEAD', '--', 'web').trim().split('\n').sort()).toEqual([page, cut]);
    const ledger = JSON.parse(readFileSync(path.join(appDir, '.weave/ledger.json'), 'utf8'));
    expect(ledger.map((entry: { path: string; session: string }) => [entry.path, entry.session]).sort()).toEqual([
      [page, 'pages-resume'],
      [cut, 'pages-resume'],
    ]);
    expect(readEvents(run).find((e) => e.type === 'session:start')).toMatchObject({ museSession });
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

  it("reads the subscription's allowance after the run, and none on a key", () => {
    const usage = (payload: unknown) => readUsage(JSON.stringify({ payload_type: 'run.usage', payload }));
    expect(usage({ models: [], allowance: { weekly: { used_percent: 31 }, window: { used_percent: 6 } } }).allowance).toEqual({ week: 31, window: 6 });
    expect(usage({ models: [] }).allowance).toBeUndefined();
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
