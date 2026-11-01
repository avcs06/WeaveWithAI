import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { createRun, readEvents, runPath } from '../core/run';
import { savePatch, saveStagePatch, stageBase, startStage } from './patches';
import { git } from './setup';

const root = mkdtempSync(path.join(tmpdir(), 'weave-patches-'));
afterAll(() => rmSync(root, { recursive: true, force: true }));
const idea = path.join(root, 'idea.md');
writeFileSync(idea, '<!-- test -->\n\nA reading list.\n');

/** A run whose app has the template and the contract's commit, then a first attempt at code-shared and a frames commit on top. */
function setup(id: string) {
  const run = createRun({ idea, runsDir: root, id });
  const appDir = runPath(run, 'app');
  mkdirSync(appDir, { recursive: true });
  git(appDir, 'init', '-q');
  writeFileSync(path.join(appDir, '.gitignore'), 'node_modules\n.nx\n');
  git(appDir, 'add', '-A');
  git(appDir, 'commit', '-q', '-m', 'template: a fresh copy');
  const commit = (stage: string, file: string, subject: string) => {
    mkdirSync(path.dirname(path.join(appDir, file)), { recursive: true });
    writeFileSync(path.join(appDir, file), `${subject}\n`);
    git(appDir, 'add', '-A');
    git(appDir, 'commit', '-q', '-m', `${stage}: ${subject}`);
    savePatch(run, appDir, stage);
  };
  commit('code-contract', 'web/app/entities/book.ts', 'entities from the contract');
  const contract = git(appDir, 'rev-parse', 'HEAD');
  commit('code-shared', '.weave/tasks/shared.md', 'inputs for shared');
  commit('code-shared', 'web/app/blocks/Card.tsx', 'shared (failed: lint)');
  saveStagePatch(run, appDir, 'code-shared');
  commit('code-frames', 'web/app/(routes)/layout.tsx', 'frames');
  return { run, appDir, contract };
}

describe('the patches of a code stage', () => {
  it('writes one patch per commit and one for the stage, both without .weave/', () => {
    const { run, contract, appDir } = setup('patches');
    expect(readdirSync(runPath(run, 'patches', 'code-shared'))).toEqual(['001-shared-failed-lint.patch']);
    const stage = readFileSync(runPath(run, 'patches', 'code-shared.patch'), 'utf8');
    expect(stage.startsWith(`code-shared: ${contract.slice(0, 7)}..`)).toBe(true);
    expect(stage).toContain('web/app/blocks/Card.tsx');
    expect(stage).not.toContain('diff --git a/.weave/');
    expect(stageBase(appDir, 'code-shared')).toBe(contract);
    expect(readEvents(run).filter((e) => e.type === 'stage:patch').map((e) => e.file)).toEqual([runPath(run, 'patches', 'code-shared.patch')]);
  });

  it('starts a restarted stage on its base: its first attempt, the stages after it and their patches are gone', () => {
    const { run, appDir, contract } = setup('restart');
    writeFileSync(path.join(appDir, 'web/app/aborted.tsx'), 'left by an aborted session\n');
    mkdirSync(path.join(appDir, '.nx'), { recursive: true });
    writeFileSync(path.join(appDir, '.nx/cache'), 'web/app/blocks/Card.tsx\n');
    mkdirSync(path.join(appDir, 'node_modules'), { recursive: true });
    writeFileSync(path.join(appDir, 'node_modules/.modules.yaml'), 'installed\n');
    startStage(run, appDir, 'code-shared');
    expect(git(appDir, 'rev-parse', 'HEAD')).toBe(contract);
    expect(git(appDir, 'status', '--porcelain')).toBe('');
    expect(existsSync(path.join(appDir, 'web/app/blocks/Card.tsx'))).toBe(false);
    // No trace of the attempt in the reflog, the object store or a cache; the install stays.
    expect(git(appDir, 'reflog')).not.toMatch(/code-shared|code-frames/);
    expect(git(appDir, 'fsck', '--unreachable', '--no-reflogs')).not.toContain('commit');
    expect(existsSync(path.join(appDir, '.nx'))).toBe(false);
    expect(existsSync(path.join(appDir, 'node_modules/.modules.yaml'))).toBe(true);
    expect(readdirSync(runPath(run, 'patches')).sort()).toEqual(['code-contract']);
    expect(readEvents(run).at(-1)).toMatchObject({ type: 'stage:reset', stage: 'code-shared', to: contract.slice(0, 7), dropped: 3, dirty: true });
  });

  it('leaves a clean app alone when the stage has not run yet', () => {
    const { run, appDir } = setup('first');
    const head = git(appDir, 'rev-parse', 'HEAD');
    startStage(run, appDir, 'code-pages');
    expect(git(appDir, 'rev-parse', 'HEAD')).toBe(head);
    expect(readEvents(run).some((e) => e.type === 'stage:reset')).toBe(false);
  });
});
