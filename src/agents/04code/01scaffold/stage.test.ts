import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { writeArtifact } from '../../../core/artifacts';
import type { Config } from '../../../core/env';
import type { Llm } from '../../../core/llm';
import { createRun, readState, runPath } from '../../../core/run';
import type { Check } from '../../../engine/session';
import { git } from '../../../engine/setup';
import type { StageContext } from '../../stages';
import { runScaffold } from './stage';

const root = mkdtempSync(path.join(tmpdir(), 'weave-scaffold-'));
afterAll(() => rmSync(root, { recursive: true, force: true }));
const idea = path.join(root, 'idea.md');
writeFileSync(idea, '# An idea\n');

// The golden freelancer theme is light only, so the scaffold pins the mode.
const golden = JSON.parse(readFileSync('fixtures/golden/freelancer-workspace/02-design/01-theme.json', 'utf8'));
const ARTIFACTS = [
  ['flows-scope', '01-flows/01-scope.json'],
  ['flows-reconcile', '01-flows/04-reconcile.json'],
  ['design-theme', '02-design/01-theme.json'],
  ['design-assemble', '02-design/08-assemble.json'],
  ['contract', '03-contract.json'],
] as const;
const FILES = ['colors.ts', 'tokens.ts', 'packages/styles/src/fonts.ts', 'packages/ui/src/Root/UIRoot.tsx'];

/** The template's themed files only, and an empty node_modules so the app counts as installed. */
async function fakeScaffold(appDir: string): Promise<void> {
  for (const file of FILES) {
    mkdirSync(path.dirname(path.join(appDir, file)), { recursive: true });
    cpSync(path.join('template', file), path.join(appDir, file));
  }
  mkdirSync(path.join(appDir, 'packages/ui/.storybook'), { recursive: true });
  mkdirSync(path.join(appDir, 'node_modules'));
}

function setup(id: string, failing?: string) {
  const run = createRun({ idea, runsDir: root, id });
  for (const [name, file] of ARTIFACTS) {
    const { data } = JSON.parse(readFileSync(`fixtures/golden/freelancer-workspace/${file}`, 'utf8'));
    writeArtifact(run, name, data, { stage: name, model: null, rounds: 1, inputs: [] });
  }
  const ran: string[] = [];
  const check = async (_appDir: string, name: string): Promise<Check> => {
    ran.push(name);
    return { name, ok: name !== failing, output: name === failing ? 'Type error' : '' };
  };
  const ctx = { run, config: {} as Config, llm: {} as Llm, interactive: false, backend: 'meta' } satisfies StageContext;
  return { run, ctx, ran, check };
}

describe('the scaffold stage', () => {
  it('themes the app, pins its one mode, records the files and runs the checks in order', async () => {
    const { run, ctx, ran, check } = setup('ok');
    await runScaffold(ctx, { scaffold: fakeScaffold, check });

    const app = (file: string) => readFileSync(runPath(run, 'app', file), 'utf8');
    expect(app('colors.ts')).toContain(golden.data.theme.colors.light.theme.accentBg);
    expect(app('packages/ui/src/Root/UIRoot.tsx')).toContain('const isDark = false;');
    const ledger = JSON.parse(app('.weave/ledger.json'));
    expect(ledger).toContainEqual({ path: 'colors.ts', status: 'M', origin: 'code', stage: 'code-scaffold' });
    expect(existsSync(runPath(run, 'app', '.git'))).toBe(true);
    // The template copy, then the scaffold's own changes, each a commit to review.
    expect(git(runPath(run, 'app'), 'log', '--format=%s')).toBe('code-scaffold: theme, .weave inputs and agent config\ntemplate: a fresh copy');
    expect(git(runPath(run, 'app'), 'diff', '--name-only', 'HEAD~1', 'HEAD')).toContain('colors.ts');
    // Its commit is a patch in the run, named in the log; the template copy is the base, with none.
    const patch = runPath(run, 'patches', '001-code-scaffold-theme-weave-inputs-and-agent-config.patch');
    expect(readFileSync(patch, 'utf8')).toContain('Subject: [PATCH] code-scaffold: theme, .weave inputs and agent config');
    const events = readFileSync(runPath(run, 'events.jsonl'), 'utf8');
    expect(events).toContain('"type":"stage:patch"');
    expect(app('.weave/01-scaffold/guidelines.md')).toContain('make your own call');
    expect(app('.weave/01-scaffold/guidelines.md')).not.toMatch(/\{\{|<!--/);
    expect(existsSync(runPath(run, 'app', '.weave/05-pages/S04/page.json'))).toBe(true);
    expect(ran).toEqual(['typecheck', 'mcp:check', 'verify']);
    expect(readState(run).stages['code-scaffold']).toMatchObject({ status: 'done' });
  });

  it('fails on a failing check and stops there', async () => {
    const { run, ctx, ran, check } = setup('typecheck', 'typecheck');
    await expect(runScaffold(ctx, { scaffold: fakeScaffold, check })).rejects.toThrow(/typecheck failed/);
    expect(ran).toEqual(['typecheck']);
    expect(readState(run).stages['code-scaffold']).toMatchObject({ status: 'failed' });
  });
});

describe('the scaffold and an app it did not make', () => {
  it('moves the folder aside, never deletes it, and makes its own', async () => {
    const { run, ctx, check } = setup('foreign');
    const appDir = runPath(run, 'app');
    mkdirSync(path.join(appDir, 'node_modules'), { recursive: true });
    writeFileSync(path.join(appDir, 'trial.txt'), 'a trial app\n');

    await runScaffold(ctx, { scaffold: fakeScaffold, check });

    const aside = readFileSync(path.join(root, 'foreign', 'events.jsonl'), 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line))
      .find((e) => e.type === 'scaffold:moved-aside');
    expect(readFileSync(path.join(aside.to, 'trial.txt'), 'utf8')).toBe('a trial app\n');
    expect(existsSync(path.join(appDir, 'trial.txt'))).toBe(false);
    expect(existsSync(path.join(appDir, '.weave/scaffold.json'))).toBe(true);
  });

  it('reuses its own app on a rerun', async () => {
    const { run, ctx, check } = setup('rerun');
    await runScaffold(ctx, { scaffold: fakeScaffold, check });
    let copies = 0;
    await runScaffold(ctx, { scaffold: async (dir) => { copies += 1; await fakeScaffold(dir); }, check });
    expect(copies).toBe(0);
    expect(existsSync(runPath(run, 'app', 'colors.ts'))).toBe(true);
  });
});
