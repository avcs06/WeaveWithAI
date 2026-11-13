import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import type { StageContext } from '../agents/stages';
import { ConfigSchema } from '../core/env';
import type { Llm } from '../core/llm';
import { createRun, readEvents, runPath, totals } from '../core/run';
import { pathBeside } from '../core/utils';
import { appCheck, type Check, resumeSession, runSession } from './session';
import { git, prepareApp } from './setup';

const root = mkdtempSync(path.join(tmpdir(), 'weave-engine-'));
afterAll(() => rmSync(root, { recursive: true, force: true }));
const idea = path.join(root, 'idea.md');
writeFileSync(idea, '<!-- test -->\n\nA reading list.\n');

const config = ConfigSchema.parse({ ANTHROPIC_API_KEY: 'test-key' });
const fake = [process.execPath, pathBeside(import.meta.url, './__fixtures__/fake-claude.mjs')];

/** A run and an app folder prepared for Claude Code, with one file in its baseline. */
function setup(id: string) {
  const run = createRun({ idea, runsDir: root, id });
  const appDir = path.join(run.dir, 'app');
  git(path.dirname(appDir), 'init', '-q', 'app');
  writeFileSync(path.join(appDir, 'README.md'), 'app\n');
  prepareApp(appDir);
  const ctx: StageContext = { run, config, llm: {} as Llm, interactive: false };
  return { run, appDir, ctx };
}

const checks =
  (failing: string[] = []) =>
  async (_appDir: string, name: string): Promise<Check> => ({ name, ok: !failing.includes(name), output: '' });

function withWrites<T>(writes: Record<string, string>, fn: () => Promise<T>): Promise<T> {
  process.env.FAKE_WRITES = JSON.stringify(writes);
  return fn().finally(() => delete process.env.FAKE_WRITES);
}

function withEnv<T>(env: Record<string, string>, fn: () => Promise<T>): Promise<T> {
  Object.assign(process.env, env);
  return fn().finally(() => {
    for (const name of Object.keys(env)) delete process.env[name];
  });
}

const page = 'web/app/(routes)/books/page.tsx';
const session = { id: 'pages', task: 'Build S04 from `.weave/04-pages/S04.md`.', routes: [{ url: '/books', signedIn: false }] };

describe('prepareApp', () => {
  it('writes the MCP and hook config, the hook and a CLAUDE.md that reads AGENTS.md, and commits a baseline', () => {
    const { appDir } = setup('prepare');
    const mcp = JSON.parse(readFileSync(path.join(appDir, '.mcp.json'), 'utf8'));
    expect(Object.keys(mcp.mcpServers)).toEqual(['weave-design-system']);
    const settings = JSON.parse(readFileSync(path.join(appDir, '.claude/settings.json'), 'utf8'));
    expect(settings.hooks.PostToolUse[0]).toEqual({ matcher: '*', hooks: [{ type: 'command', command: 'node .weave/hooks/validate-edit.mjs' }] });
    expect(existsSync(path.join(appDir, '.weave/hooks/validate-edit.mjs'))).toBe(true);
    expect(readFileSync(path.join(appDir, 'CLAUDE.md'), 'utf8')).toBe('@AGENTS.md\n');
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
    // The task goes on stdin, with the key in the environment.
    expect(result.summary).toBe(`built it (${session.task.length} characters of task, key)`);
    expect(result.changed).toEqual([page]);
    expect(result.usage).toMatchObject({ calls: 3, input: 21000, cached: 18000, output: 900, reasoning: 180 });
    // Claude Code's own estimate, which covers every model the session called.
    expect(result.costUsd).toBeCloseTo(0.03);
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

  it("runs on the subscription's token without the key .env holds, and counts its tokens but no spend", async () => {
    const { run, appDir, ctx } = setup('subscription');
    const subscription = { ...config, CLAUDE_AUTH: 'subscription' as const, CLAUDE_CODE_OAUTH_TOKEN: 'oauth-token' };
    const result = await withEnv({ ANTHROPIC_API_KEY: 'from-dotenv' }, () =>
      withWrites({ [page]: 'export default 1;\n' }, () =>
        runSession({ ...ctx, config: subscription }, appDir, session, { bin: fake, runCheck: checks() }),
      ),
    );
    expect(result.summary).toBe(`built it (${session.task.length} characters of task, token)`);
    expect(result.costUsd).toBe(0);
    expect(readEvents(run).find((e) => e.type === 'llm:call')).toMatchObject({ input: 21000, costUsd: 0, billing: 'subscription' });
    expect(totals(run)).toMatchObject({ calls: 3, costUsd: 0 });
  });

  it("starts the unit's Claude Code session, and a fix resumes it and counts only its own share of the totals", async () => {
    const { run, appDir, ctx } = setup('continue');
    const claudeSession = '0d6a1b52-7c1e-4f0a-9a43-2f1b6b0e3c11';
    const args = runPath(run, 'claude-args.log');
    const first = await withEnv({ FAKE_ARGS: args }, () =>
      withWrites({ [page]: 'export default 1;\n' }, () => runSession(ctx, appDir, { ...session, claudeSession }, { bin: fake, runCheck: checks() })),
    );
    // Claude Code carries the first session's 3 turns into the resumed one's totals.
    const fix = await withEnv({ FAKE_ARGS: args, FAKE_BEFORE: '3', FAKE_VARY: '1' }, () =>
      withWrites({ [page]: 'export default 2;\n' }, () =>
        runSession(ctx, appDir, { ...session, id: 'pages-fix-1', claudeSession, continues: true }, { bin: fake, runCheck: checks() }),
      ),
    );
    const [started, resumed] = readFileSync(args, 'utf8').trim().split('\n');
    expect(started).toContain(`--session-id ${claudeSession}`);
    expect(resumed).toContain(`--resume ${claudeSession}`);
    expect(first.usage).toMatchObject({ calls: 3, input: 21000 });
    expect(fix.usage).toMatchObject({ calls: 3, input: 21000, cached: 18000, output: 900 });
    expect(fix.costUsd).toBeCloseTo(0.03);
    expect(totals(run).calls).toBe(6);
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

  it("keeps the reason a Claude Code that fails before it starts gives on stderr as the session's summary", async () => {
    const { appDir, ctx } = setup('stderr');
    process.env.FAKE_STDERR = 'Invalid API key · Fix external API key';
    const result = await runSession(ctx, appDir, session, { bin: fake, runCheck: checks() }).finally(() => delete process.env.FAKE_STDERR);
    expect(result.status).toBe('failed');
    expect(result.summary).toBe('Invalid API key · Fix external API key');
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
  it("resumes the cut Claude Code session by its id, and counts the cut session's uncommitted files as its own", async () => {
    const { run, appDir, ctx } = setup('resume');
    const claudeSession = '6fc17888-93c9-445e-a984-940be5c78d23';
    // What the cut session wrote before the run was killed: in the app, never committed.
    const cut = 'web/app/(routes)/shelves/page.tsx';
    mkdirSync(path.join(appDir, path.dirname(cut)), { recursive: true });
    writeFileSync(path.join(appDir, cut), 'export default 2;\n');
    process.env.FAKE_ARGS = runPath(run, 'claude-args.log');
    const result = await withWrites({ [page]: 'export default 1;\n' }, () =>
      resumeSession(ctx, appDir, { ...session, id: 'pages-resume', claudeSession }, { bin: fake, runCheck: checks() }),
    ).finally(() => delete process.env.FAKE_ARGS);

    expect(readFileSync(runPath(run, 'claude-args.log'), 'utf8')).toContain(`--resume ${claudeSession}`);
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
    expect(readEvents(run).find((e) => e.type === 'session:start')).toMatchObject({ claudeSession });
  });
});
