import pLimit from 'p-limit';
import { readArtifact, writeArtifact } from '../../../core/artifacts';
import { appendEvent, updateStage } from '../../../core/run';
import { type Inventory, inventory } from '../../../ds/inventory';
import type { StageContext, StageDef } from '../../stages';
import type { Processed as Plan } from '../02architect/process';
import type { Processed as Catalog } from '../03catalog/process';
import { caller, designInputs, kindOf, PARALLEL } from '../calls';
import { withFixedGaps } from '../gaps';
import {
  componentReviewGuides,
  componentSystemPrompt,
  componentUserMessage,
} from './prompts/index';
import { type ComponentDesign, DESIGN_KEYS, makeInventSchemas } from './schema';
import { validateComponent } from './validation/validation';

// Invent draws each new component at medium reasoning, its first draft at 0.7:
// the creative expansion of the architect's description.
const COMPONENT_MAX_TOKENS = 16_384;
const COMPONENT_EFFORT = 'medium';

/** `02-design/05-invent.json`: each declared component's design and the model that wrote it. */
export type Invented = {
  components: { name: string; design: ComponentDesign; model: string }[];
};

/** A call per declared component. */
export async function runInvent(ctx: StageContext, inv: Inventory): Promise<void> {
  const { run } = ctx;
  appendEvent(run, { type: 'stage:start', stage: 'design-invent' });
  updateStage(run, 'design-invent', { status: 'running' });
  const plan = readArtifact<Plan>(run, 'design-architect').data;
  const catalog = readArtifact<Catalog>(run, 'design-catalog').data;
  const { scope, brief, theme, context } = designInputs(run, inv);
  const { ComponentDesign } = makeInventSchemas(inv);
  const { call, totals } = caller(ctx);
  const limit = pLimit(PARALLEL);
  const components = await Promise.all(
    plan.newComponents.map((declared) =>
      limit(async () => {
        const range = catalog.components.find((c) => c.name === declared.name) ?? {
          minWidthPx: 0,
          maxWidthPx: 0,
          slots: [],
        };
        const lists = catalog.widgets.some(
          (w) => w.newComponents.includes(declared.name) && (w.kind === 'list' || w.kind === 'cards'),
        );
        const fixed = (design: ComponentDesign) => withFixedGaps(design, lists);
        const { output, model } = await call({
          stage: `design-invent-${declared.name}`,
          schema: ComponentDesign,
          schemaName: 'ComponentDesign',
          system: componentSystemPrompt(brief, inv),
          user: componentUserMessage(declared.name, plan, catalog, scope, brief, theme),
          validate: (design) =>
            validateComponent(declared.name, fixed(design), range, kindOf(declared.name, plan, catalog), context, theme),
          review: componentReviewGuides(),
          maxTokens: COMPONENT_MAX_TOKENS,
          reasoningEffort: COMPONENT_EFFORT,
          temperature: 0.7,
          patchKeys: DESIGN_KEYS,
        });
        return { name: declared.name, design: fixed(output), model };
      }),
    ),
  );
  const { rounds, known } = totals();
  writeArtifact(run, 'design-invent', { components } satisfies Invented, {
    stage: 'design-invent',
    model: components[0]?.model ?? null,
    rounds,
    inputs: ['design-architect', 'design-catalog', 'design-theme', 'flows-scope'],
  });
  updateStage(run, 'design-invent', { rounds, known });
  appendEvent(run, { type: 'stage:done', stage: 'design-invent', rounds, known });
}

export const inventStage: StageDef = {
  name: 'design-invent',
  produces: ['design-invent'],
  run: async (ctx) => runInvent(ctx, await inventory()),
};
