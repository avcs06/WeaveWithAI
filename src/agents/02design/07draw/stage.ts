import pLimit from 'p-limit';
import { readArtifact, writeArtifact } from '../../../core/artifacts';
import type { Issue } from '../../../core/issues';
import { appendEvent, updateStage } from '../../../core/run';
import { type Inventory, inventory } from '../../../ds/inventory';
import { draftOf } from '../../../runner/draft';
import type { StageContext, StageDef } from '../../stages';
import type { WidgetIa } from '../03architect/schema';
import { componentsOf, type Invented } from '../06invent/stage';
import { caller, designInputs, PARALLEL } from '../calls';
import {
  widgetReviewGuides,
  widgetsSystemPrompt,
  widgetsUserMessage,
} from './prompts/index';
import { makeDrawSchemas, type WidgetBatch } from './schema';
import { validateBatch } from './validation/validation';

// A widget call builds two widgets at medium (DS23).
const DRAW_MAX_TOKENS = 16_384;
const DRAW_EFFORT = 'medium';
const PER_CALL = 2;

/** `02-design/07-draw.json`: each call's widgets, its builds and the model that wrote them. */
export type Drawn = {
  batches: { key: string; ids: string[]; output: WidgetBatch; model: string }[];
};

/** Widgets in the order their screens place them, two to a call; a call's key names its widgets. */
export function batchesOf(ia: WidgetIa): Map<string, string[]> {
  const order = (id: string) => {
    const first = ia.placements
      .filter((p) => p.widget === id)
      .sort((a, b) => a.screen.localeCompare(b.screen) || a.order - b.order)[0];
    return first
      ? `${first.screen} ${String(first.order).padStart(3, '0')}`
      : '';
  };
  const placed = ia.widgets
    .map((w) => w.id)
    .filter(order)
    .sort((a, b) => order(a).localeCompare(order(b)));
  const batches = new Map<string, string[]>();
  for (let i = 0; i < placed.length; i += PER_CALL) {
    const ids = placed.slice(i, i + PER_CALL);
    batches.set(ids.join('-'), ids);
  }
  return batches;
}

/** What a stage needs to draw widgets: the calls, the IA, the components and the inputs. */
function drawing(ctx: StageContext, inv: Inventory) {
  const { run } = ctx;
  const ia = readArtifact<WidgetIa>(run, 'design-architect').data;
  const components = componentsOf(
    ia,
    readArtifact<Invented>(run, 'design-invent').data,
  );
  const { scope, flows, brief, theme, context } = designInputs(run, inv);
  const { WidgetBatch } = makeDrawSchemas(inv);
  const { call, totals } = caller(ctx);
  /** One call for `ids`; given issues, a fix from its last output named `<stage>-fix`, without reviewers. */
  const draw = async (
    key: string,
    ids: string[],
    previous?: Drawn['batches'][number],
    seed?: Issue[],
  ) => {
    const start =
      seed && previous ? draftOf(previous.output, previous.model) : undefined;
    const { output, model } = await call({
      stage: `design-draw-${key}${start ? '-fix' : ''}`,
      schema: WidgetBatch,
      schemaName: 'WidgetBatch',
      system: widgetsSystemPrompt(ids, brief, inv),
      user: widgetsUserMessage(ids, ia, components, flows, scope, brief, theme),
      validate: (batch) => validateBatch(batch, ids, ia, context, theme),
      review: start ? undefined : widgetReviewGuides(),
      maxTokens: DRAW_MAX_TOKENS,
      reasoningEffort: DRAW_EFFORT,
      start,
      seed: start && seed,
    });
    return { key, ids, output, model };
  };
  return { ia, draw, totals };
}

const INPUTS = [
  'design-architect',
  'design-invent',
  'design-brief',
  'design-theme',
  'flows-scope',
  'flows-reconcile',
] as const;

/** A call per two widgets, in the order the screens place them. */
export async function runDraw(
  ctx: StageContext,
  inv: Inventory,
): Promise<void> {
  const { run } = ctx;
  appendEvent(run, { type: 'stage:start', stage: 'design-draw' });
  updateStage(run, 'design-draw', { status: 'running' });
  const { ia, draw, totals } = drawing(ctx, inv);
  const limit = pLimit(PARALLEL);
  const batches = await Promise.all(
    [...batchesOf(ia)].map(([key, ids]) => limit(() => draw(key, ids))),
  );
  const { rounds, known } = totals();
  writeArtifact(run, 'design-draw', { batches } satisfies Drawn, {
    stage: 'design-draw',
    model: batches[0]?.model ?? null,
    rounds,
    inputs: [...INPUTS],
  });
  updateStage(run, 'design-draw', { rounds, known, batches: batches.length });
  appendEvent(run, { type: 'stage:done', stage: 'design-draw', rounds, known });
}

/**
 * Fixes once the calls that built widgets with issues on the assembled design,
 * each from its last output, and writes the new builds (DS23). `seeds` is
 * keyed by widget id; a call fixes the issues of all its widgets.
 */
export async function fixWidgets(
  ctx: StageContext,
  inv: Inventory,
  seeds: Map<string, Issue[]>,
): Promise<void> {
  const { run } = ctx;
  const envelope = readArtifact<Drawn>(run, 'design-draw');
  const { draw, totals } = drawing(ctx, inv);
  const limit = pLimit(PARALLEL);
  const batches = await Promise.all(
    envelope.data.batches.map((batch) => {
      const issues = batch.ids.flatMap((id) => seeds.get(id) ?? []);
      return issues.length
        ? limit(() => draw(batch.key, batch.ids, batch, issues))
        : batch;
    }),
  );
  writeArtifact(run, 'design-draw', { batches } satisfies Drawn, {
    stage: 'design-draw',
    model: envelope.meta.model,
    rounds: envelope.meta.rounds + totals().rounds,
    inputs: [...INPUTS],
  });
}

export const drawStage: StageDef = {
  name: 'design-draw',
  produces: ['design-draw'],
  run: async (ctx) => runDraw(ctx, await inventory()),
};
