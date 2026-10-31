import pLimit from 'p-limit';
import { readArtifact, writeArtifact } from '../../../core/artifacts';
import type { Issue } from '../../../core/issues';
import { appendEvent, updateStage } from '../../../core/run';
import { type Inventory, inventory } from '../../../ds/inventory';
import { draftOf } from '../../../runner/draft';
import type { StageContext, StageDef } from '../../stages';
import { planAsIa, type Processed as Plan } from '../02architect/process';
import type { Defined, Processed as Catalog } from '../03catalog/process';
import { caller, designInputs, kindOf } from '../calls';
import { withFixedGaps } from '../gaps';
import { leadsOf } from '../rules/helpers';
import {
  widgetReviewGuides,
  widgetsSystemPrompt,
  widgetsUserMessage,
} from './prompts/index';
import { BUILD_KEYS, type Build, makeDrawSchemas } from './schema';
import { validateDrawn } from './validation/validation';

// A draw call builds one widget at medium (DS23): one widget a call to measure
// what it costs against three, and so a fix patches the widget's own nodes
// (user, 2026-10-31). Six calls run at a time.
const DRAW_MAX_TOKENS = 32_768;
const DRAW_EFFORT = 'medium';
const DRAW_PARALLEL = 6;

/** `02-design/06-draw.json`: each widget's build and the model that wrote it. */
export type Drawn = {
  widgets: { widget: string; output: Build; model: string }[];
};

/** The widgets in the order the screens list them, a call each. */
export function drawOrder(catalog: Catalog): string[] {
  const defined = new Set(catalog.widgets.map((w) => w.id));
  return [...new Set(catalog.screens.flatMap((s) => s.parts).filter((part) => defined.has(part)))];
}

/** What a stage needs to draw widgets: the calls, the catalog and the inputs. */
function drawing(ctx: StageContext, inv: Inventory) {
  const { run } = ctx;
  const plan = readArtifact<Plan>(run, 'design-architect').data;
  const catalog = readArtifact<Catalog>(run, 'design-catalog').data;
  const widgets = new Map<string, Defined>(catalog.widgets.map((w) => [w.id, w]));
  // A held component is sized from its catalog width range: invent's design may not exist yet.
  const newComponents = planAsIa(plan).newComponents.map((c) => {
    const range = catalog.components.find((x) => x.name === c.name);
    const fixed = range !== undefined && range.minWidthPx > 0 && range.minWidthPx === range.maxWidthPx;
    return {
      ...c,
      minWidthPx: range?.minWidthPx ?? 0,
      maxWidthPx: range?.maxWidthPx ?? 0,
      box: fixed ? { ...c.box, width: 'fixed' as const, widthPx: range.minWidthPx } : c.box,
    };
  });
  const { scope, flows, brief, theme, context } = designInputs(run, inv);
  const { Build } = makeDrawSchemas(inv);
  const { call, totals } = caller(ctx);
  /** One call for widget `id`; given issues, a fix from its last output named `<stage>-fix`, without reviewers. */
  const draw = async (id: string, previous?: Drawn['widgets'][number], seed?: Issue[]) => {
    const start =
      seed && previous ? draftOf(previous.output, previous.model) : undefined;
    const widget = widgets.get(id);
    if (!widget) throw new Error(`the catalog has no widget ${id}`);
    const fixed = (build: Build) => withFixedGaps(build, widget.kind === 'list' || widget.kind === 'cards');
    const leads = leadsOf(widget, plan, catalog, flows);
    const { output, model } = await call({
      stage: `design-draw-${id}${start ? '-fix' : ''}`,
      schema: Build,
      schemaName: 'Build',
      system: widgetsSystemPrompt(brief, inv),
      user: widgetsUserMessage(widget, plan, catalog, flows, scope, brief, theme),
      validate: (build) =>
        validateDrawn(fixed(build), widget, leads, kindOf(id, plan, catalog), newComponents, context, theme),
      review: start ? undefined : widgetReviewGuides(),
      maxTokens: DRAW_MAX_TOKENS,
      reasoningEffort: DRAW_EFFORT,
      patchKeys: BUILD_KEYS,
      start,
      seed: start && seed,
    });
    return { widget: id, output: fixed(output), model };
  };
  return { catalog, draw, totals };
}

const INPUTS = [
  'design-architect',
  'design-catalog',
  'design-theme',
  'flows-scope',
  'flows-reconcile',
] as const;

/** A call per widget, in the order the screens list them, six at a time. */
export async function runDraw(
  ctx: StageContext,
  inv: Inventory,
): Promise<void> {
  const { run } = ctx;
  appendEvent(run, { type: 'stage:start', stage: 'design-draw' });
  updateStage(run, 'design-draw', { status: 'running' });
  const { catalog, draw, totals } = drawing(ctx, inv);
  const limit = pLimit(DRAW_PARALLEL);
  const widgets = await Promise.all(drawOrder(catalog).map((id) => limit(() => draw(id))));
  const { rounds, known } = totals();
  writeArtifact(run, 'design-draw', { widgets } satisfies Drawn, {
    stage: 'design-draw',
    model: widgets[0]?.model ?? null,
    rounds,
    inputs: [...INPUTS],
  });
  updateStage(run, 'design-draw', { rounds, known, batches: widgets.length });
  appendEvent(run, { type: 'stage:done', stage: 'design-draw', rounds, known });
}

/**
 * Fixes once the calls that built widgets with issues on the assembled design,
 * each from its last output, and writes the new builds (DS23). `seeds` is
 * keyed by widget id.
 */
export async function fixWidgets(
  ctx: StageContext,
  inv: Inventory,
  seeds: Map<string, Issue[]>,
): Promise<void> {
  const { run } = ctx;
  const envelope = readArtifact<Drawn>(run, 'design-draw');
  const { draw, totals } = drawing(ctx, inv);
  const limit = pLimit(DRAW_PARALLEL);
  const widgets = await Promise.all(
    envelope.data.widgets.map((drawn) => {
      const issues = seeds.get(drawn.widget) ?? [];
      return issues.length ? limit(() => draw(drawn.widget, drawn, issues)) : drawn;
    }),
  );
  writeArtifact(run, 'design-draw', { widgets } satisfies Drawn, {
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
