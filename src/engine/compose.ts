import { z } from 'zod';
import { resolveBackend } from '../core/backends';
import type { Issue } from '../core/issues';
import type { Compose, Draft, Round } from '../runner/runSpecStage';
import type { StageContext } from '../agents/stages';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { checkIssues, type LongFile, MAX_LINES } from './checks';
import type { ScreenExpect } from './conformance';
import { protectedOf, type ReadRules, runSession, type SessionDeps, type SessionResult } from './session';
import { git } from './setup';

// A coding unit on the stage runner (CD5): its draft and its fixes are Muse
// Code sessions, its validators are the checks after each session, and its
// reviewers read the unit's whole diff.

/** Round 1: the session, the checks, both reviewers. Round 2: a fix and both again. Round 3: a final fix (D1.6). */
export const CODE_SCHEDULE: Round[] = [
  { fix: false, reviewers: ['output'] },
  { fix: true, reviewers: ['output'] },
  { fix: true, reviewers: [] },
];

export type Unit = {
  /** 'shared', 'frames', 'page-S04': the session ids and the runner's stage name end with it. */
  id: string;
  /** The run's stage of the unit, such as `code-pages-S04`. */
  stage?: string;
  task: string;
  /** The fix session's task for the pending issues. */
  fixTask: (pending: Issue[]) => string;
  /** The paths the unit may write: a file, or `folder/**`. */
  writes: string[];
  /** The paths its guidelines keep it from reading, measured after the session. */
  reads?: ReadRules;
  route?: string;
  expect?: ScreenExpect;
  /** The rendered checks on the unit's routes, once its app builds. */
  rendered?: () => Promise<Issue[]>;
};

export type UnitResult = {
  session: Pick<SessionResult, 'status' | 'summary' | 'checks' | 'protectedHits' | 'changed' | 'readsOutside'> & { longFiles: LongFile[] };
  rendered: Issue[];
  diff: string;
};

/** The runner asks for a schema; a unit's result is built by code, never parsed from a model. */
export const UnitResultSchema = z.custom<UnitResult>();

/** The validators of a unit: pure, over what the session's checks found. */
export function unitIssues(result: UnitResult): Issue[] {
  return [...checkIssues(result.session), ...result.rendered];
}

export function sessionCompose(
  ctx: StageContext,
  appDir: string,
  unit: Unit,
  deps: SessionDeps = {},
): Compose<UnitResult> {
  const baseline = git(appDir, 'rev-parse', 'HEAD');
  let sessions = 0;
  const run = async (task: string): Promise<Draft<UnitResult>> => {
    sessions += 1;
    const id = sessions === 1 ? unit.id : `${unit.id}-fix-${sessions - 1}`;
    const result = await runSession(
      ctx,
      appDir,
      { id, task, inputs: {}, route: unit.route, expect: unit.expect, writes: unit.writes, reads: unit.reads, stage: unit.stage },
      deps,
    );
    // Rendered checks only mean something on a route that loads.
    const loads = result.checks.every((check) => check.ok || check.name === 'design');
    const rendered = unit.rendered && loads ? await unit.rendered() : [];
    const diff = git(appDir, 'diff', baseline, '--', '.', ':(exclude).weave');
    // Over the unit's whole diff: a fix that leaves a bad file alone has not undone it.
    const touched = git(appDir, 'diff', '--name-only', baseline, '--', '.', ':(exclude).weave').split('\n').filter(Boolean);
    const protectedHits = protectedOf(touched, unit);
    const longFiles = touched
      .filter((file) => /\.(tsx?|css\.ts)$/.test(file) && existsSync(path.join(appDir, file)))
      .map((file) => ({ path: file, lines: readFileSync(path.join(appDir, file), 'utf8').split('\n').length }))
      .filter((file) => file.lines > MAX_LINES);
    const { status, summary, checks, changed, readsOutside } = result;
    return {
      data: { session: { status, summary, checks, protectedHits, changed, readsOutside, longFiles }, rendered, diff },
      raw: `${diff}\n\n## The agent's summary\n\n${summary}`,
      model: resolveBackend(ctx.config, ctx.backend).model,
    };
  };
  return {
    draft: () => run(unit.task),
    fix: (_call, _current, pending) => run(unit.fixTask(pending)),
  };
}
