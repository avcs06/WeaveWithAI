import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { ConfigSchema } from '../../core/env';
import type { GenerateInput, Llm } from '../../core/llm';
import { createRun, readEvents, runPath } from '../../core/run';
import { pathBeside } from '../../core/utils';
import type { Check } from '../../engine/session';
import { git, prepareApp } from '../../engine/setup';
import type { StageContext } from '../stages';
import { runUnit, runUnits, type UnitSpec } from './unit';

const root = mkdtempSync(path.join(tmpdir(), 'weave-unit-'));
afterAll(() => rmSync(root, { recursive: true, force: true }));
const idea = path.join(root, 'idea.md');
writeFileSync(idea, '# An idea\n');
const fakeMuse = [process.execPath, pathBeside(import.meta.url, '../../engine/__fixtures__/fake-muse.mjs')];
const config = ConfigSchema.parse({ MODEL_API_KEY: 'k' });

/** Reviewers that block once, from the code reviewer in round 1, then pass. */
function fakeReviewers(blockFirst: boolean) {
  const reviews: GenerateInput<unknown>[] = [];
  const llm: Llm = {
    async generateStructured(input) {
      reviews.push(input as GenerateInput<unknown>);
      const blocking = blockFirst && input.stage.endsWith('-review-code') && input.round === 1;
      const data = { blockers: blocking ? [{ at: 'web/app/(routes)/books/page.tsx', problem: 'The page does two jobs.', fix: 'Split the list out.' }] : [] };
      return { data: data as never, raw: JSON.stringify(data), usage: { input: 1, cachedInput: 0, output: 1 }, costUsd: 0, replayed: false, backend: 'meta', model: 'muse-spark-1.3', durationMs: 1 };
    },
  };
  return { llm, reviews };
}

function setup(id: string, blockFirst: boolean, failing: (name: string, session: number) => boolean) {
  const run = createRun({ idea, runsDir: root, id });
  const appDir = runPath(run, 'app');
  mkdirSync(path.join(appDir, '.weave/04-pages/S04'), { recursive: true });
  writeFileSync(path.join(appDir, '.weave/04-pages/guidelines.md'), 'Pages go in their route folder.');
  writeFileSync(path.join(appDir, '.weave/04-pages/S04/page.json'), '{ "screens": [] }');
  git(appDir, 'init', '-q');
  prepareApp(appDir);
  const { llm, reviews } = fakeReviewers(blockFirst);
  const sessionsRun: string[] = [];
  let typechecks = 0;
  const runCheck = async (_dir: string, name: string): Promise<Check> => {
    if (name === 'typecheck') typechecks += 1;
    const ok = !failing(name, typechecks);
    return { name, ok, output: ok ? '' : 'error TS2304: Cannot find name x.' };
  };
  const ctx: StageContext = { run, config, llm, interactive: false, backend: 'meta' };
  const spec: UnitSpec = {
    id: 'page-S04',
    stage: 'code-pages-S04',
    task: 'Build S04 from .weave/04-pages/S04/.',
    folders: ['04-pages', '04-pages/S04'],
    writes: ['web/app/(routes)/books/**'],
  };
  const tasks = () => sessionsRun;
  return { run, ctx, spec, reviews, deps: { bin: fakeMuse, runCheck }, tasks };
}

const withWrites = <T>(writes: Record<string, string>, fn: () => Promise<T>) => {
  process.env.FAKE_WRITES = JSON.stringify(writes);
  return fn().finally(() => delete process.env.FAKE_WRITES);
};
const page = { 'web/app/(routes)/books/page.tsx': 'export default function Page() { return null; }\n' };

describe('a coding unit', () => {
  it('sends a failed check and a reviewer blocker to one fix session, and ends clean in round 2', async () => {
    const { run, ctx, spec, reviews, deps } = setup('fixed', true, (name, n) => name === 'typecheck' && n === 1);
    const result = await withWrites(page, () => runUnit(ctx, spec, deps));

    expect(result.rounds).toBe(2);
    expect(result.known).toEqual([]);
    const fixTask = (await import('node:fs')).readFileSync(runPath(run, 'app', '.weave/tasks/page-S04-fix-1.md'), 'utf8');
    expect(fixTask).toContain('CODE-002');
    expect(fixTask).toContain('The page does two jobs.');
    // Round 1: both reviewers saw the diff and the failed check.
    const round1 = reviews.filter((r) => r.round === 1);
    expect(round1.map((r) => r.stage).sort()).toEqual(['code-pages-S04-review-adherence', 'code-pages-S04-review-code']);
    const user = String(round1[0]?.messages.at(-1)?.content);
    expect(user).toContain('books/page.tsx');
    expect(user).toContain('CODE-002');
  });

  it('records what is left after round 3 as known, and returns', async () => {
    const { ctx, spec, deps } = setup('known', false, (name) => name === 'typecheck');
    process.env.FAKE_VARY = '1';
    process.env.FAKE_ARGS = runPath(ctx.run, 'muse-args.log');
    const result = await withWrites(page, () => runUnit(ctx, spec, deps)).finally(() => delete process.env.FAKE_VARY);
    expect(result.rounds).toBe(3);
    expect(result.known.map((i) => i.rule)).toEqual(['CODE-002']);
    // The three sessions are one Muse session; another attempt at the unit starts its own.
    const ids = () => readFileSync(runPath(ctx.run, 'muse-args.log'), 'utf8').match(/--session-id \S+/g) ?? [];
    expect(ids()).toHaveLength(3);
    expect(new Set(ids()).size).toBe(1);
    // Each session is its own commit, failed or not, and a patch; the inputs commits touch only .weave/ and make none.
    const appDir = runPath(ctx.run, 'app');
    expect(git(appDir, 'status', '--porcelain')).toBe('');
    expect(git(appDir, 'log', '-1', '--format=%s')).toBe('code-pages-S04: page-S04-fix-2 (failed: typecheck)');
    expect(readdirSync(runPath(ctx.run, 'patches', 'code-pages-S04'))).toEqual([
      '001-page-S04-failed-typecheck.patch',
      '002-page-S04-fix-1-failed-typecheck.patch',
      '003-page-S04-fix-2-failed-typecheck.patch',
    ]);
    await withWrites(page, () => runUnit(ctx, spec, deps)).finally(() => delete process.env.FAKE_ARGS);
    expect(new Set(ids()).size).toBe(2);
  });

  it('logs a stage start and done once, whether its unit carries its name or units have their own', async () => {
    const { ctx, spec, deps } = setup('events', false, () => false);
    const count = (type: string, stage: string) => readEvents(ctx.run).filter((e) => e.type === type && e.stage === stage).length;
    await withWrites(page, () => runUnits(ctx, 'code-shared', [{ ...spec, id: 'shared', stage: 'code-shared' }], deps));
    expect([count('stage:start', 'code-shared'), count('stage:done', 'code-shared')]).toEqual([1, 1]);
    await withWrites(page, () => runUnits(ctx, 'code-pages', [spec], deps));
    expect([count('stage:start', 'code-pages'), count('stage:done', 'code-pages')]).toEqual([1, 1]);
  });

  it("warns about a read its guidelines rule out, from the hook's tool log", async () => {
    const { ctx, spec, deps } = setup('reads', false, () => false);
    const log = `${JSON.stringify({ tool: 'bash', command: 'cat packages/ui/src/Dialog/Dialog.tsx' })}\n`;
    const result = await withWrites({ ...page, '.weave/tools.log': log }, () => runUnit(ctx, spec, deps));
    expect(result.known).toEqual([]);
    expect(result.warnings.map((i) => [i.rule, i.at])).toContainEqual(['CODE-010', 'packages/ui/src/Dialog/Dialog.tsx']);
  });

  it('takes a folder listed on the way to an allowed file, or the unit\'s own folder, as no read to warn about', async () => {
    const { ctx, spec, deps } = setup('toward', false, () => false);
    const reads = { deny: ['web/app/(routes)/**', '.weave/04-pages/**'], allow: ['web/app/(routes)/books/**', '.weave/04-pages/S04/**'] };
    const log = ['ls web/app/\\(routes\\)/books', 'ls .weave/04-pages/', 'cat web/app/\\(routes\\)/other/page.tsx']
      .map((command) => JSON.stringify({ tool: 'bash', command }))
      .join('\n');
    const result = await withWrites({ ...page, '.weave/tools.log': `${log}\n` }, () => runUnit(ctx, { ...spec, reads }, deps));
    expect(result.warnings.filter((i) => i.rule === 'CODE-010').map((i) => i.at)).toEqual(['web/app/(routes)/other/page.tsx']);
  });

  it('fails a write outside the unit paths with CODE-004', async () => {
    const { ctx, spec, deps } = setup('outside', false, () => false);
    const writes = { ...page, 'web/app/blocks/Header/Header.tsx': 'export {};\n' };
    const result = await withWrites(writes, () => runUnit(ctx, spec, deps));
    expect(result.known.map((i) => i.rule)).toContain('CODE-004');
  });
});
