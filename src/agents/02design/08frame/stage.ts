import pLimit from 'p-limit';
import { readArtifact, writeArtifact } from '../../../core/artifacts';
import type { Issue } from '../../../core/issues';
import { appendEvent, updateStage } from '../../../core/run';
import { type Inventory, inventory } from '../../../ds/inventory';
import { draftOf } from '../../../runner/draft';
import type { StageContext, StageDef } from '../../stages';
import type { Shell } from '../schema';
import type { Processed as Plan } from '../03architect/process';
import type { Processed as Catalog } from '../04catalog/process';
import { caller, designInputs, PARALLEL } from '../calls';
import {
  frameReviewGuides,
  frameSystemPrompt,
  frameUserMessage,
} from './prompts/index';
import { FRAME_KEYS, type FrameBuild, makeFrameSchemas } from './schema';
import { validateFrame } from './validation/validation';

// A frame call fills one shell at medium (DS23).
const FRAME_MAX_TOKENS = 16_384;
const FRAME_EFFORT = 'medium';

/** `02-design/08-frame.json`: each used shell's nodes and the model that wrote them. */
export type Framed = {
  frames: { shell: string; output: FrameBuild; model: string }[];
};

/** The steps a shell's frame serves: those catalog gave the frame of each framed page of its kind. */
export function frameStepsOf(plan: Plan, catalog: Catalog, shell: Shell): string[] {
  const pages = new Set(
    plan.screens
      .filter((s) => s.type === 'page' && s.framed && s.kind === shell.name)
      .map((s) => s.id),
  );
  return [
    ...new Set(
      catalog.screens.filter((s) => pages.has(s.screen)).flatMap((s) => s.frameSteps),
    ),
  ];
}

/** What a stage needs to fill frames: the calls, the plan, the shells and the inputs. */
function framing(ctx: StageContext, inv: Inventory) {
  const { run } = ctx;
  const plan = readArtifact<Plan>(run, 'design-architect').data;
  const catalog = readArtifact<Catalog>(run, 'design-catalog').data;
  const { scope, brief, theme, shells, context } = designInputs(run, inv);
  const stepsOf = (shell: string) => {
    const found = shells.find((s) => s.id === shell);
    return found ? frameStepsOf(plan, catalog, found) : [];
  };
  const { FrameBuild } = makeFrameSchemas(inv);
  const { call, totals } = caller(ctx);
  /** One call for `shell`; given issues, a fix from its last output named `<stage>-fix`, without reviewers. */
  const frame = async (
    shell: string,
    previous?: Framed['frames'][number],
    seed?: Issue[],
  ) => {
    const start =
      seed && previous ? draftOf(previous.output, previous.model) : undefined;
    const { output, model } = await call({
      stage: `design-frame-${shell}${start ? '-fix' : ''}`,
      schema: FrameBuild,
      schemaName: 'FrameBuild',
      system: frameSystemPrompt(brief, inv),
      user: frameUserMessage(shell, plan, stepsOf(shell), shells, scope, brief, theme),
      validate: (built) => validateFrame(built, plan, stepsOf(shell), context, theme),
      review: start ? undefined : frameReviewGuides(),
      maxTokens: FRAME_MAX_TOKENS,
      reasoningEffort: FRAME_EFFORT,
      patchKeys: FRAME_KEYS,
      start,
      seed: start && seed,
    });
    return { shell, output, model };
  };
  return { plan, shells, frame, totals };
}

const INPUTS = [
  'design-architect',
  'design-catalog',
  'design-brief',
  'design-theme',
  'flows-scope',
] as const;

/** A call per shell a framed page uses. */
export async function runFrame(
  ctx: StageContext,
  inv: Inventory,
): Promise<void> {
  const { run } = ctx;
  appendEvent(run, { type: 'stage:start', stage: 'design-frame' });
  updateStage(run, 'design-frame', { status: 'running' });
  const { plan, shells, frame, totals } = framing(ctx, inv);
  // The shells a framed page uses: the frame of each page kind that has one.
  const kinds = new Set<string>(
    plan.screens.filter((s) => s.type === 'page' && s.framed).map((s) => s.kind),
  );
  const limit = pLimit(PARALLEL);
  const frames = await Promise.all(
    shells.filter((s) => kinds.has(s.name)).map((s) => limit(() => frame(s.id))),
  );
  const { rounds, known } = totals();
  writeArtifact(run, 'design-frame', { frames } satisfies Framed, {
    stage: 'design-frame',
    model: frames[0]?.model ?? null,
    rounds,
    inputs: [...INPUTS],
  });
  updateStage(run, 'design-frame', { rounds, known });
  appendEvent(run, {
    type: 'stage:done',
    stage: 'design-frame',
    rounds,
    known,
  });
}

/** Fixes once the frame calls with issues on the assembled design, from their last output, and writes the new frames (DS23). */
export async function fixFrames(
  ctx: StageContext,
  inv: Inventory,
  seeds: Map<string, Issue[]>,
): Promise<void> {
  const { run } = ctx;
  const envelope = readArtifact<Framed>(run, 'design-frame');
  const { frame, totals } = framing(ctx, inv);
  const limit = pLimit(PARALLEL);
  const frames = await Promise.all(
    envelope.data.frames.map((built) => {
      const issues = seeds.get(built.shell);
      return issues?.length
        ? limit(() => frame(built.shell, built, issues))
        : built;
    }),
  );
  writeArtifact(run, 'design-frame', { frames } satisfies Framed, {
    stage: 'design-frame',
    model: envelope.meta.model,
    rounds: envelope.meta.rounds + totals().rounds,
    inputs: [...INPUTS],
  });
}

export const frameStage: StageDef = {
  name: 'design-frame',
  produces: ['design-frame'],
  run: async (ctx) => runFrame(ctx, await inventory()),
};
