import pLimit from 'p-limit';
import { readArtifact, writeArtifact } from '../../../core/artifacts';
import { appendEvent, updateStage } from '../../../core/run';
import { type Inventory, inventory } from '../../../ds/inventory';
import type { StageContext, StageDef } from '../../stages';
import type { WidgetIa } from '../03architect/schema';
import { caller, designInputs, PARALLEL } from '../calls';
import type { NewComponent } from '../schema';
import {
  componentReviewGuides,
  componentSystemPrompt,
  componentUserMessage,
} from './prompts/index';
import { type ComponentDesign, makeInventSchemas } from './schema';
import { validateComponent } from './validation/validation';

// A component is designed once, in full, at high (DS23).
const COMPONENT_MAX_TOKENS = 16_384;
const COMPONENT_EFFORT = 'high';

/** `02-design/06-invent.json`: each declared component's design and the model that wrote it. */
export type Invented = {
  components: { name: string; design: ComponentDesign; model: string }[];
};

/** Each component's design by name. */
export const designsOf = (invented: Invented) =>
  new Map(invented.components.map((c) => [c.name, c.design]));

/** The IA's declarations with their designs, as the widget calls build on them. */
export const componentsOf = (
  ia: WidgetIa,
  invented: Invented,
): NewComponent[] => {
  const designs = designsOf(invented);
  return ia.newComponents.flatMap((c) => {
    const design = designs.get(c.name);
    return design ? [{ ...c, ...design, usedOn: [] }] : [];
  });
};

/** A call per declared component, each designing it in full before any widget uses it. */
export async function runInvent(
  ctx: StageContext,
  inv: Inventory,
): Promise<void> {
  const { run } = ctx;
  appendEvent(run, { type: 'stage:start', stage: 'design-invent' });
  updateStage(run, 'design-invent', { status: 'running' });
  const ia = readArtifact<WidgetIa>(run, 'design-architect').data;
  const { scope, brief, theme, context } = designInputs(run, inv);
  const { ComponentDesign } = makeInventSchemas(inv);
  const { call, totals } = caller(ctx);
  const limit = pLimit(PARALLEL);
  const components = await Promise.all(
    ia.newComponents.map((declared) =>
      limit(async () => {
        const { output, model } = await call({
          stage: `design-invent-${declared.name}`,
          schema: ComponentDesign,
          schemaName: 'ComponentDesign',
          system: componentSystemPrompt(declared.name, inv),
          user: componentUserMessage(declared.name, ia, scope, brief, theme),
          validate: (design) =>
            validateComponent(
              { ...declared, ...design, usedOn: [] },
              ia,
              context,
            ),
          review: componentReviewGuides(),
          maxTokens: COMPONENT_MAX_TOKENS,
          reasoningEffort: COMPONENT_EFFORT,
        });
        return { name: declared.name, design: output, model };
      }),
    ),
  );
  const { rounds, known } = totals();
  writeArtifact(run, 'design-invent', { components } satisfies Invented, {
    stage: 'design-invent',
    model: components[0]?.model ?? null,
    rounds,
    inputs: ['design-architect', 'design-brief', 'design-theme', 'flows-scope'],
  });
  updateStage(run, 'design-invent', { rounds, known });
  appendEvent(run, {
    type: 'stage:done',
    stage: 'design-invent',
    rounds,
    known,
  });
}

export const inventStage: StageDef = {
  name: 'design-invent',
  produces: ['design-invent'],
  run: async (ctx) => runInvent(ctx, await inventory()),
};
