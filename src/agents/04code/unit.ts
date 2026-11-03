import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { formatIssues } from '../../core/issues';
import { fillPrompt, loadPrompt } from '../../core/prompt';
import { appendEvent, readEvents, type Run, runPath, updateStage } from '../../core/run';
import { pathBeside, writeJsonAtomic } from '../../core/utils';
import { uxPractices } from '../../ds/ux';
import {
  CODE_SCHEDULE,
  sessionCompose,
  type Unit,
  type UnitResult,
  UnitResultSchema,
  unitDraft,
  unitIssues,
} from '../../engine/compose';
import { saveStagePatch, startStage } from '../../engine/patches';
import { resumeSession, type SessionDeps, sessionSlug } from '../../engine/session';
import { git } from '../../engine/setup';
import { type Draft, runSpecStage, type SpecStageResult } from '../../runner/runSpecStage';
import type { StageContext } from '../stages';

// One coding unit of a code stage on the stage runner: its session,
// the checks after it, and the three reviewers, code, adherence and behavior.

const load = (file: string) => loadPrompt(pathBeside(import.meta.url, `./prompts/${file}`));

/** Code wrote the entity layer; a session adds to it when a screen needs an operation or a field it lacks. */
export const ENTITIES = 'web/app/entities/**';

/** What no session should read: the design system's and the tools' code, and the token and Tailwind files the MCP answers for. */
export const READS_DENIED = ['packages/**', 'tools/**', 'tokens.ts', 'colors.ts', 'tailwind.preset.cjs', 'web/tailwind.config.js'];

/** The design system's components in the app, by folder, as the MCP lists them. */
function designSystemComponents(appDir: string): string {
  const root = path.join(appDir, 'packages', 'ui', 'src');
  if (!existsSync(root)) return 'none';
  // The folders the MCP config leaves out of the inventory.
  const internal = new Set(['Selectable', 'utils']);
  const names = readdirSync(root).filter((name) => !internal.has(name) && statSync(path.join(root, name)).isDirectory());
  return names.sort().join(', ') || 'none';
}

/**
 * The three output reviewers of every coding unit: the code reviewer knows the components, the adherence reviewer
 * the UX practices, and the behavior reviewer judges state, failures and security.
 */
function codeReviewGuides(appDir: string): Record<string, string> {
  return {
    code: fillPrompt(load('review-code.md'), { components: designSystemComponents(appDir) }),
    adherence: fillPrompt(load('review-adherence.md'), { ux: uxPractices() }),
    behavior: load('review-behavior.md'),
  };
}

/** A unit as its stage describes it: the runner's stage name and the .weave folders its session reads. */
export type UnitSpec = Omit<Unit, 'fixTask'> & { stage: string; folders: string[] };

/** A .weave file, or every file of a .weave folder with its subfolders, as `## path` and the text. */
function folderText(appDir: string, folder: string): string {
  const root = path.join(appDir, '.weave', folder);
  if (!existsSync(root)) return '';
  const walk = (at: string): string[] =>
    statSync(at).isDirectory()
      ? readdirSync(at)
          .sort()
          .flatMap((name) => walk(path.join(at, name)))
      : [at];
  return walk(root)
    .map((file) => `## .weave/${path.relative(path.join(appDir, '.weave'), file)}\n\n${readFileSync(file, 'utf8')}`)
    .join('\n\n');
}

/** A unit's round that `weave session-resume` finished, for `weave run --round` to review: what the session made, and where the unit picks up. */
export type SavedRound = { stage: string; unit: string; round: number; museSession: string; baseline: string; draft: Draft<UnitResult> };

const savedRoundFile = (run: Run, stage: string, round: number) => runPath(run, 'resume', `${stage}-round-${round}.json`);

/**
 * Finishes the cut session of a code stage's unit, such as one a killed run left mid-task, in its own Muse session,
 * and saves what it made as its round's output.
 */
export async function resumeUnit(
  ctx: StageContext,
  spec: UnitSpec,
  museSession?: string,
  deps: SessionDeps = {},
): Promise<{ file: string; saved: SavedRound }> {
  const appDir = runPath(ctx.run, 'app');
  const inputs = `${spec.stage}: inputs for `;
  const commits = git(appDir, 'log', '--reverse', '--format=%H %s').split('\n').filter(Boolean);
  const last = commits.at(-1)?.slice(41) ?? '';
  // A cut session has its inputs commit and no commit of its own after it.
  if (!last.startsWith(inputs)) throw new Error(`${spec.stage}: its last session finished (${last}), so there is nothing to resume`);
  // `pages` is round 1 and `pages-fix-2` round 3; a resume that was cut too resumes the same round.
  const cut = last.slice(inputs.length).replace(/(-resume)+$/, '');
  const fix = cut === spec.id ? '0' : cut.startsWith(`${spec.id}-fix-`) ? cut.slice(`${spec.id}-fix-`.length) : '';
  if (!/^\d+$/.test(fix)) throw new Error(`${spec.stage}: the cut session ${cut} is none of unit ${spec.id}'s`);
  // The unit's diff starts where its first session did, after anything code committed for the stage.
  const first = commits.find((line) => line.slice(41) === `${inputs}${spec.id}`);
  if (!first) throw new Error(`${spec.stage}: no inputs commit for unit ${spec.id}`);
  const baseline = git(appDir, 'rev-parse', `${first.slice(0, 40)}^`).trim();
  // Sessions log their Muse session from now on; a run from before gives it by hand, from runs/<id>/muse/sessions/.
  const logged = readEvents(ctx.run)
    .filter((e) => e.type === 'session:start' && String(e.stage).startsWith(`session:${spec.id}`) && typeof e.museSession === 'string')
    .at(-1)?.museSession;
  const id = museSession ?? (logged as string | undefined);
  if (!id) throw new Error(`${spec.stage}: no Muse session logged for ${cut}; pass --muse-session with its id`);

  const result = await resumeSession(
    ctx,
    appDir,
    {
      id: `${cut}-resume`,
      task: fillPrompt(load('resume-task.md'), { task: `.weave/tasks/${sessionSlug(cut)}.md` }),
      routes: spec.routes,
      expects: spec.expects,
      reads: spec.reads ?? { deny: READS_DENIED },
      stage: spec.stage,
      museSession: id,
      maxSteps: spec.maxSteps,
      timeoutMs: spec.timeoutMs,
    },
    deps,
  );
  const saved: SavedRound = {
    stage: spec.stage,
    unit: spec.id,
    round: Number(fix) + 1,
    museSession: id,
    baseline,
    draft: await unitDraft(ctx, appDir, spec, baseline, result),
  };
  const file = savedRoundFile(ctx.run, spec.stage, saved.round);
  writeJsonAtomic(file, saved);
  return { file, saved };
}

export async function runUnit(
  ctx: StageContext,
  spec: UnitSpec,
  deps: SessionDeps = {},
  saved?: SavedRound,
): Promise<SpecStageResult<UnitResult>> {
  const appDir = runPath(ctx.run, 'app');
  const guidelines = spec.folders.map((folder) => folderText(appDir, `${folder}/guidelines.md`));
  // The reviewers get what the agent was told and the unit's own folder; the earlier folders stay out to keep the review small.
  const own = spec.folders.at(-1) ?? '';
  const unit: Unit = {
    ...spec,
    reads: spec.reads ?? { deny: READS_DENIED },
    fixTask: (pending) =>
      fillPrompt(load('fix-task.md'), {
        folders: spec.folders.map((f) => `\`.weave/${f}/\``).join(', '),
        issues: formatIssues(pending),
      }),
  };
  return runSpecStage({
    run: ctx.run,
    llm: ctx.llm,
    stage: spec.stage,
    schema: UnitResultSchema,
    schemaName: 'Unit',
    system: [...guidelines.filter(Boolean), `## The task\n\n${spec.task}`].join('\n\n'),
    user: folderText(appDir, own),
    validate: unitIssues,
    review: { output: codeReviewGuides(appDir) },
    reviewInput: load('review-input.md'),
    reviewersSeeMandatory: true,
    schedule: CODE_SCHEDULE,
    compose: sessionCompose(
      ctx,
      appDir,
      unit,
      deps,
      saved && { museSession: saved.museSession, sessions: saved.round, baseline: saved.baseline },
    ),
    resume: saved && { round: saved.round, draft: saved.draft },
  });
}

/**
 * A code stage's units, one after another: they share the app's git tree and its dev server port. `prepare` writes
 * what code makes for the stage, after the stage's reset and before its first session.
 */
export async function runUnits(
  ctx: StageContext,
  stage: string,
  specs: UnitSpec[],
  deps: SessionDeps = {},
  prepare?: (appDir: string) => Promise<void>,
): Promise<void> {
  // A stage resumed at a round keeps the app its cut attempt left; its one unit picks up where the saved round says.
  let saved: SavedRound | undefined;
  if (ctx.resume?.stage === stage) {
    const file = savedRoundFile(ctx.run, stage, ctx.resume.round);
    if (!existsSync(file)) throw new Error(`${stage}: no saved round ${ctx.resume.round} at ${file}; run weave session-resume first`);
    saved = JSON.parse(readFileSync(file, 'utf8')) as SavedRound;
    if (specs.length !== 1 || specs[0]?.id !== saved.unit)
      throw new Error(`${stage}: round ${saved.round} was saved for unit ${saved.unit}; a resume needs a stage of that one unit`);
  }
  // A unit named after its stage logs the stage's start and done itself.
  const own = !specs.some((spec) => spec.stage === stage);
  if (own) appendEvent(ctx.run, { type: 'stage:start', stage });
  updateStage(ctx.run, stage, { status: 'running' });
  const appDir = runPath(ctx.run, 'app');
  if (!saved) {
    startStage(ctx.run, appDir, stage);
    await prepare?.(appDir);
  }
  let known = 0;
  let rounds = 0;
  for (const spec of specs) {
    const result = await runUnit(ctx, spec, deps, saved);
    known += result.known.length;
    rounds = Math.max(rounds, result.rounds);
  }
  saveStagePatch(ctx.run, appDir, stage);
  updateStage(ctx.run, stage, { status: 'done', known, rounds, batches: specs.length });
  if (own) appendEvent(ctx.run, { type: 'stage:done', stage, known, rounds });
}
