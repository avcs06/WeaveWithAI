import { writeArtifact } from '../../../core/artifacts';
import { type Inventory, inventory } from '../../../ds/inventory';
import { runSpecStage } from '../../../runner/runSpecStage';
import type { StageContext, StageDef } from '../../stages';
import { designInputs } from '../calls';
import { iaReviewGuides, iaSystemPrompt, iaUserMessage } from './prompts/index';
import { makeArchitectSchemas } from './schema';
import { validateWidgetIa } from './validation/validation';

// The IA writes the screens, the copy deck, the widgets and their placements, and reasons at high; it starts
// at the client's 64k cap, so no cut is billed before a doubling (user, 2026-10-30).
const IA_MAX_TOKENS = 65_536;
const IA_EFFORT = 'high';

/** The IA call: every screen planned once, with its copy, widgets and placements (DS23). */
export async function runArchitect(
  ctx: StageContext,
  inv: Inventory,
): Promise<void> {
  const { run, llm } = ctx;
  const { scope, flows, brief, theme, context } = designInputs(run, inv);
  const result = await runSpecStage({
    run,
    llm,
    stage: 'design-architect',
    schema: makeArchitectSchemas(inv).Ia,
    schemaName: 'Ia',
    system: iaSystemPrompt(brief, inv),
    user: iaUserMessage(scope, flows, brief, theme.layouts),
    validate: (draft) => validateWidgetIa(draft, context),
    review: iaReviewGuides(),
    maxTokens: IA_MAX_TOKENS,
    reasoningEffort: IA_EFFORT,
  });
  writeArtifact(run, 'design-architect', result.output, {
    stage: 'design-architect',
    model: result.model,
    rounds: result.rounds,
    inputs: ['flows-scope', 'flows-reconcile', 'design-brief', 'design-theme'],
  });
}

export const architectStage: StageDef = {
  name: 'design-architect',
  produces: ['design-architect'],
  run: async (ctx) => runArchitect(ctx, await inventory()),
};
