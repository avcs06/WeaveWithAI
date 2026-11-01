import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { appendEvent, type Run, runPath } from '../core/run';
import { git } from './setup';

// Every commit the generator makes in an app is a patch in the run, and each
// code stage is one more patch, whole (user, 2026-11-01). Each commit's
// subject starts with its stage's name, which is how a stage finds its own
// commits. `.weave/` stays out of the patches: it holds the sessions' inputs
// and logs, not the app.

const APP_ONLY = ['--', '.', ':!.weave'];

/** The commit a stage builds on: the parent of its first commit, its units' (`code-pages-S04: `) included, or HEAD while it has none. */
export function stageBase(appDir: string, stage: string): string {
  const first = git(appDir, 'log', '--reverse', '--format=%H %s')
    .split('\n')
    .find((line) => line.slice(41).startsWith(`${stage}: `) || line.slice(41).startsWith(`${stage}-`));
  return git(appDir, 'rev-parse', first ? `${first.slice(0, 40)}^` : 'HEAD').trim();
}

/**
 * Starts a code stage clean: the app back at the stage's base. An earlier attempt at the stage, the
 * stages built on it, and whatever an aborted session left uncommitted are thrown away, with their patches.
 */
export function startStage(run: Run, appDir: string, stage: string): void {
  const base = stageBase(appDir, stage);
  const dropped = git(appDir, 'log', '--format=%s', `${base}..HEAD`).split('\n').filter(Boolean);
  const dirty = git(appDir, 'status', '--porcelain').trim() !== '';
  if (!dropped.length && !dirty) return;
  for (const name of new Set([stage, ...dropped.map((subject) => subject.split(':')[0] ?? '')])) {
    rmSync(runPath(run, 'patches', name), { recursive: true, force: true });
    rmSync(runPath(run, 'patches', `${name}.patch`), { force: true });
  }
  git(appDir, 'reset', '-q', '--hard', base);
  // Nothing of the attempt may stay for a session to find: not in the reflog, the object store, or a
  // cache that saw its files (Nx, Next, tsc). Only the installs stay.
  git(appDir, 'clean', '-fdqx', '-e', 'node_modules', '-e', 'tools/weave-design-system-mcp/dist');
  git(appDir, 'reflog', 'expire', '--expire=now', '--all');
  git(appDir, 'gc', '-q', '--prune=now');
  appendEvent(run, { type: 'stage:reset', stage, to: base.slice(0, 7), dropped: dropped.length, dirty });
}

/** Writes HEAD's commit as `patches/<stage>/<NNN>-<subject>.patch`; none when it changed nothing outside `.weave/`. */
export function savePatch(run: Run, appDir: string, stage: string): string | undefined {
  const parents = git(appDir, 'rev-list', '--parents', '-n', '1', 'HEAD').split(' ').length - 1;
  if (parents === 0 || !git(appDir, 'diff', '--name-only', 'HEAD~1', 'HEAD', ...APP_ONLY).trim()) return undefined;
  const dir = runPath(run, 'patches', stage);
  mkdirSync(dir, { recursive: true });
  const number = String(readdirSync(dir).length + 1).padStart(3, '0');
  const subject = git(appDir, 'log', '-1', '--format=%s')
    .replace(`${stage}: `, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  const file = runPath(run, 'patches', stage, `${number}-${subject}.patch`);
  writeFileSync(file, `${git(appDir, 'format-patch', '-1', '--stdout', 'HEAD', ...APP_ONLY)}\n`);
  return file;
}

/** Writes the whole stage, its base to HEAD, as `patches/<stage>.patch` and logs it; none when it changed nothing outside `.weave/`. */
export function saveStagePatch(run: Run, appDir: string, stage: string): string | undefined {
  const base = stageBase(appDir, stage);
  const diff = git(appDir, 'diff', base, 'HEAD', ...APP_ONLY);
  if (!diff.trim()) return undefined;
  const range = `${base.slice(0, 7)}..${git(appDir, 'rev-parse', '--short=7', 'HEAD').trim()}`;
  const stat = git(appDir, 'diff', '--stat', base, 'HEAD', ...APP_ONLY);
  const file = runPath(run, 'patches', `${stage}.patch`);
  mkdirSync(runPath(run, 'patches'), { recursive: true });
  writeFileSync(file, `${stage}: ${range}\n\n${stat}\n\n${diff}\n`);
  appendEvent(run, { type: 'stage:patch', stage, file });
  return file;
}
