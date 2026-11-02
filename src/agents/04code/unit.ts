import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { formatIssues } from '../../core/issues';
import { fillPrompt, loadPrompt } from '../../core/prompt';
import { appendEvent, runPath, updateStage } from '../../core/run';
import { pathBeside } from '../../core/utils';
import { CODE_SCHEDULE, sessionCompose, type Unit, type UnitResult, UnitResultSchema, unitIssues } from '../../engine/compose';
import { saveStagePatch, startStage } from '../../engine/patches';
import type { SessionDeps } from '../../engine/session';
import { runSpecStage, type SpecStageResult } from '../../runner/runSpecStage';
import type { StageContext } from '../stages';

// One coding unit of a code stage on the stage runner: its session,
// the checks after it, and the two reviewers, code and adherence.

const load = (file: string) => loadPrompt(pathBeside(import.meta.url, `./prompts/${file}`));

/** Code wrote the entity layer; a session adds to it when a screen needs an operation or a field it lacks. */
export const ENTITIES = 'web/app/entities/**';

/** What no session should read: the design system's and the tools' code, and the token and Tailwind files the MCP answers for. */
export const READS_DENIED = ['packages/**', 'tools/**', 'tokens.ts', 'colors.ts', 'tailwind.preset.cjs', 'web/tailwind.config.js'];

/** The two output reviewers of every coding unit. */
function codeReviewGuides(): Record<string, string> {
  return { code: load('review-code.md'), adherence: load('review-adherence.md') };
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

export async function runUnit(
  ctx: StageContext,
  spec: UnitSpec,
  deps: SessionDeps = {},
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
    review: { output: codeReviewGuides() },
    reviewInput: load('review-input.md'),
    reviewersSeeMandatory: true,
    schedule: CODE_SCHEDULE,
    compose: sessionCompose(ctx, appDir, unit, deps),
  });
}

/** A code stage's units, one after another: they share the app's git tree and its dev server port. */
export async function runUnits(ctx: StageContext, stage: string, specs: UnitSpec[], deps: SessionDeps = {}): Promise<void> {
  // A unit named after its stage logs the stage's start and done itself.
  const own = !specs.some((spec) => spec.stage === stage);
  if (own) appendEvent(ctx.run, { type: 'stage:start', stage });
  updateStage(ctx.run, stage, { status: 'running' });
  const appDir = runPath(ctx.run, 'app');
  startStage(ctx.run, appDir, stage);
  let known = 0;
  let rounds = 0;
  for (const spec of specs) {
    const result = await runUnit(ctx, spec, deps);
    known += result.known.length;
    rounds = Math.max(rounds, result.rounds);
  }
  saveStagePatch(ctx.run, appDir, stage);
  updateStage(ctx.run, stage, { status: 'done', known, rounds, batches: specs.length });
  if (own) appendEvent(ctx.run, { type: 'stage:done', stage, known, rounds });
}
