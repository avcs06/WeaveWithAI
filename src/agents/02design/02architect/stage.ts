import { writeArtifact } from '../../../core/artifacts';
import { type Inventory, inventory } from '../../../ds/inventory';
import { runSpecStage } from '../../../runner/runSpecStage';
import type { StageContext, StageDef } from '../../stages';
import { designInputs } from '../calls';
import { processPlan } from './process';
import { planReviewGuides, planSystemPrompt, planUserMessage } from './prompts/index';
import { makeArchitectSchema, PLAN_KEYS } from './schema';
import { validatePlan } from './validation/validation';

// The architect plans every screen once, at high reasoning, its first draft at
// 0.7; it starts at the client's 64k cap, so no cut is billed before a
// doubling.
const PLAN_MAX_TOKENS = 65_536;
const PLAN_EFFORT = 'high';

/** The architect's call: the screens, the navigation and the new components, with what follows from them filled in. */
export async function runArchitect(ctx: StageContext, inv: Inventory): Promise<void> {
  const { run, llm } = ctx;
  const { scope, flows, brief, theme, context } = designInputs(run, inv);
  const result = await runSpecStage({
    run,
    llm,
    stage: 'design-architect',
    schema: makeArchitectSchema(inv).Plan,
    schemaName: 'Plan',
    system: planSystemPrompt(brief, inv),
    user: planUserMessage(scope, flows, brief, theme.layouts),
    validate: (plan) => validatePlan(processPlan(plan, flows, scope), theme.layouts, context),
    review: planReviewGuides(),
    maxTokens: PLAN_MAX_TOKENS,
    reasoningEffort: PLAN_EFFORT,
    temperature: 0.7,
    patchKeys: PLAN_KEYS,
  });
  writeArtifact(run, 'design-architect', processPlan(result.output, flows, scope), {
    stage: 'design-architect',
    model: result.model,
    rounds: result.rounds,
    inputs: ['flows-scope', 'flows-expand', 'design-theme'],
  });
}

export const architectStage: StageDef = {
  name: 'design-architect',
  produces: ['design-architect'],
  run: async (ctx) => runArchitect(ctx, await inventory()),
};
