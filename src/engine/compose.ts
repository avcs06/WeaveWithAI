import { z } from 'zod';
import { resolveBackend } from '../core/backends';
import type { Issue } from '../core/issues';
import type { ImageInput } from '../core/llm';
import { runPath } from '../core/run';
import type { Compose, Draft, Round } from '../runner/runSpecStage';
import { Reply, type Thread } from '../runner/threads';
import type { StageContext } from '../agents/stages';
import { randomUUID } from 'node:crypto';
import { appendFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { checkIssues, type LongFile, MAX_LINES } from './checks';
import type { ScreenExpect } from './conformance';
import { UNIT_MARKER, type UnreadRecipe, unreadInFiles } from './recipes';
import { type CheckedRoute, protectedOf, runSession, type SessionDeps, type SessionResult } from './session';
import { git } from './setup';

// A coding unit on the stage runner: its draft and its fixes are Muse
// Code sessions, its validators are the checks after each session, and its
// reviewers read the unit's whole diff.

/**
 * Three rounds, as many as a spec stage: the session, its checks and the reviewers; a fix, its checks and the
 * reviewers again; then the final fix, which nobody reviews, so what its checks and round 2's reviewers left is
 * recorded as known. `output` is the runner's slot, not one reviewer: a code unit fills it with its named guides
 * (unit.ts), and the runner makes one call for each. Code units have no peer reviewer.
 */
export const CODE_SCHEDULE: Round[] = [
  { fix: false, reviewers: ['output'] },
  { fix: true, reviewers: ['output'] },
  { fix: true, reviewers: [] },
];

/** Where a fix session writes its reply to each thread. */
const REPLIES = '.weave/replies.json';

export type Unit = {
  /** 'frames', 'pages': the session ids and the runner's stage name end with it. */
  id: string;
  /** The run's stage of the unit, such as `code-pages`. */
  stage?: string;
  task: string;
  /** The fix session's task for the pending threads. */
  fixTask: (pending: Thread[]) => string;
  /** The routes `pnpm verify` checks after each session. */
  routes?: CheckedRoute[];
  /** What each of its screens' code must name. */
  expects?: ScreenExpect[];
  /** The rendered checks on the unit's routes, once its app builds, with a screenshot of each route in `shotsDir`. */
  rendered?: (shotsDir: string) => Promise<Rendered>;
  /** The session's model-step cap and time limit; the session's defaults when unset. */
  maxSteps?: number;
  timeoutMs?: number;
};

/** Where the agent's summary starts in the text the reviewers read, after the unit's diff. */
export const SUMMARY_HEAD = "## The agent's summary\n\n";

/** A route's screenshot, with the screen it shows. */
export type Shot = ImageInput & { screen: string };

/** What the rendered checks give back: their issues, and each route's screenshot for the reviewers that look at them. */
export type Rendered = { issues: Issue[]; shots: Shot[] };

export type UnitResult = {
  session: Pick<SessionResult, 'status' | 'summary' | 'checks' | 'protectedHits' | 'changed'> & {
    longFiles: LongFile[];
    unreadRecipes: UnreadRecipe[];
  };
  rendered: Issue[];
  diff: string;
  shots: Shot[];
};

/** The runner asks for a schema; a unit's result is built by code, never parsed from a model. */
export const UnitResultSchema = z.custom<UnitResult>();

/** The validators of a unit: pure, over what the session's checks found. */
export function unitIssues(result: UnitResult): Issue[] {
  return [...checkIssues(result.session), ...result.rendered];
}

/** Where a unit picks up after a resumed session: its Muse session, the sessions it has run, and the commit its diff starts from. */
export type UnitResume = { museSession: string; sessions: number; baseline: string };

export function sessionCompose(
  ctx: StageContext,
  appDir: string,
  unit: Unit,
  deps: SessionDeps = {},
  resumed?: UnitResume,
): Compose<UnitResult> {
  const baseline = resumed?.baseline ?? git(appDir, 'rev-parse', 'HEAD');
  // One agent session per attempt at the unit: its fixes continue it, and a restarted stage starts a new one.
  // OpenCode names its own in the unit's first session.
  let museSession = resumed?.museSession ?? (resolveBackend(ctx.config, ctx.backend).agent === 'muse' ? randomUUID() : undefined);
  let sessions = resumed?.sessions ?? 0;
  const run = async (task: string): Promise<Draft<UnitResult>> => {
    sessions += 1;
    const id = sessions === 1 ? unit.id : `${unit.id}-fix-${sessions - 1}`;
    // The recipe gate counts reads from here: the unit's fixes continue its Muse session, which holds what it read.
    if (sessions === 1)
      appendFileSync(path.join(appDir, '.weave', 'tools.log'), `${JSON.stringify({ at: new Date().toISOString(), tool: UNIT_MARKER, unit: unit.id })}\n`);
    // A session that cannot run at all, such as one whose container never starts, is a failed session: the run goes on.
    const result: SessionResult = await runSession(
      ctx,
      appDir,
      {
        id,
        task,
        routes: unit.routes,
        expects: unit.expects,
        stage: unit.stage,
        museSession,
        maxSteps: unit.maxSteps,
        timeoutMs: unit.timeoutMs,
      },
      deps,
    ).catch((error: unknown) => ({
      status: 'failed' as const,
      summary: `The session could not run: ${String(error).split('\n')[0]}`,
      changed: [],
      protectedHits: [],
      usage: { calls: 0, input: 0, cached: 0, output: 0, reasoning: 0 },
      costUsd: 0,
      checks: [],
    }));
    museSession ??= result.agentSession;
    return unitDraft(ctx, appDir, unit, baseline, result, id);
  };
  return {
    draft: () => run(unit.task),
    // The fix task asks for the replies in REPLIES; a file the session leaves out or gets wrong gives none.
    async fix(_call, _current, pending) {
      const file = path.join(appDir, REPLIES);
      rmSync(file, { force: true });
      const draft = await run(unit.fixTask(pending));
      let replies: Reply[] = [];
      try {
        replies = z.array(Reply).parse(JSON.parse(readFileSync(file, 'utf8')));
      } catch {}
      return { ...draft, replies };
    },
  };
}

/**
 * What the reviewers read after one of a unit's sessions: its checks, the rendered checks, the unit's whole diff
 * since `baseline`, and the screenshots the session `id`'s checks took.
 */
export async function unitDraft(
  ctx: StageContext,
  appDir: string,
  unit: Pick<Unit, 'rendered'>,
  baseline: string,
  result: SessionResult,
  id: string,
): Promise<Draft<UnitResult>> {
  // Rendered checks only mean something on a route that loads.
  const loads = result.checks.every((check) => check.ok || check.name === 'design');
  // A checker that cannot run, such as a dev server that never starts, is noted; the unit goes on.
  const { issues: rendered, shots }: Rendered =
    unit.rendered && loads
      ? await unit.rendered(runPath(ctx.run, 'shots', id)).catch((error: unknown) => ({
          issues: [
            {
              rule: 'DESIGN-R-000',
              severity: 'warning' as const,
              message: `The browser checks could not run: ${String(error).split('\n')[0]}`,
            },
          ],
          shots: [],
        }))
      : { issues: [], shots: [] };
  const diff = git(appDir, 'diff', baseline, '--', '.', ':(exclude).weave');
  // Over the unit's whole diff: a fix that leaves a bad file alone has not undone it.
  const touched = git(appDir, 'diff', '--name-only', baseline, '--', '.', ':(exclude).weave').split('\n').filter(Boolean);
  const protectedHits = protectedOf(touched);
  const sources = touched
    .filter((file) => /\.tsx?$/.test(file) && existsSync(path.join(appDir, file)))
    .map((file) => ({ file, text: readFileSync(path.join(appDir, file), 'utf8') }));
  const longFiles = sources
    .map(({ file, text }) => ({ path: file, lines: text.split('\n').length }))
    .filter((file) => file.lines > MAX_LINES);
  // The recipe gate's leftovers, over the unit's whole diff: reads count from the unit's marker.
  const log = path.join(appDir, '.weave', 'tools.log');
  const unreadRecipes = unreadInFiles(sources, existsSync(log) ? readFileSync(log, 'utf8') : '');
  const { status, summary, checks, changed } = result;
  return {
    data: { session: { status, summary, checks, protectedHits, changed, unreadRecipes, longFiles }, rendered, diff, shots },
    raw: `${diff}\n\n${SUMMARY_HEAD}${summary}`,
    model: resolveBackend(ctx.config, ctx.backend).model,
  };
}
