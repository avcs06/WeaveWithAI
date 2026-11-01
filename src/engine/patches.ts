import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { appendEvent, type Run, runPath } from '../core/run';
import { git } from './setup';

// Every step the generator commits in an app is also a patch file in the run
// (user, 2026-11-01), so each one can be reviewed on its own, in order.

/** Writes HEAD's commit as `patches/<NNN>-<subject>.patch` and logs it; none for a commit that changed nothing or for the first one. */
export function savePatch(run: Run, appDir: string, stage: string): string | undefined {
  const parents = git(appDir, 'rev-list', '--parents', '-n', '1', 'HEAD').split(' ').length - 1;
  if (parents === 0 || !git(appDir, 'diff', '--name-only', 'HEAD~1', 'HEAD').trim()) return undefined;
  const dir = runPath(run, 'patches');
  mkdirSync(dir, { recursive: true });
  const number = readdirSync(dir).filter((file) => file.endsWith('.patch')).length + 1;
  const subject = git(appDir, 'log', '-1', '--format=%s').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  const file = `patches/${String(number).padStart(3, '0')}-${subject}.patch`;
  writeFileSync(runPath(run, file), git(appDir, 'format-patch', '-1', '--stdout', 'HEAD'));
  appendEvent(run, { type: 'stage:patch', stage, file: runPath(run, file) });
  return runPath(run, file);
}
