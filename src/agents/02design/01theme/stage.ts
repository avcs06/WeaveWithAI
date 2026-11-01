import { readFileSync } from 'node:fs';
import { readArtifact, writeArtifact } from '../../../core/artifacts';
import { runRules } from '../../../core/rules';
import { runPath } from '../../../core/run';
import { inventory, type Inventory } from '../../../ds/inventory';
import { runSpecStage } from '../../../runner/runSpecStage';
import type { Scope } from '../../01flows/01scope/schema';
import type { Flows } from '../../01flows/schema';
import type { StageContext, StageDef } from '../../stages';
import { type Themed, themed } from './build';
import {
  themeReviewGuides,
  themeSystemPrompt,
  themeUserMessage,
} from './prompts/index';
import { makeThemeSchema } from './schema';
import { briefRules, validateTheme } from './validation/validation';

// One call sets the direction and every value: the
// brief, every color, both page layouts and the component defaults.

// Reasoning tokens count toward the budget: the call reasons at high and writes the brief and the theme.
const THEME_MAX_TOKENS = 32_768;

// The direction needs the most reasoning and room to be creative, so the first draft also runs at 0.7.
const THEME_EFFORT = 'high';

const THEME_TEMPERATURE = 0.7;

// A better first draft leaves fewer issues for the fixes, so it runs on the strong model.
const THEME_DRAFT_MODEL = 'strong';

/** The theme call: the brief and the theme its values become, from the idea, the scope and the flows. */
export async function runTheme(ctx: StageContext, inv: Inventory): Promise<void> {
  const { run, llm } = ctx;
  const idea = readFileSync(runPath(run, 'input', 'idea.md'), 'utf8');
  const scope = readArtifact<Scope>(run, 'flows-scope').data;
  const flows = readArtifact<Flows>(run, 'flows-reconcile').data;
  const result = await runSpecStage({
    run,
    llm,
    stage: 'design-theme',
    schema: makeThemeSchema(inv),
    schemaName: 'Theme',
    system: themeSystemPrompt(inv),
    user: themeUserMessage(idea, scope, flows),
    // The rules read the built theme, so a failing contrast pair goes back to this call.
    validate: (call) => validateTheme(call, scope, inv),
    review: themeReviewGuides(),
    maxTokens: THEME_MAX_TOKENS,
    reasoningEffort: THEME_EFFORT,
    temperature: THEME_TEMPERATURE,
    draftModel: THEME_DRAFT_MODEL,
  });
  writeArtifact(run, 'design-theme', themed(result.output), {
    stage: 'design-theme',
    model: result.model,
    rounds: result.rounds,
    inputs: ['flows-scope', 'flows-reconcile'],
  });
}

export const themeStage: StageDef = {
  name: 'design-theme',
  produces: ['design-theme'],
  run: async (ctx) => runTheme(ctx, await inventory()),
  // The brief's rules; the theme's need the inventory, which `weave validate` does not load.
  validate: (run) =>
    runRules(briefRules, {
      brief: readArtifact<Themed>(run, 'design-theme').data.brief,
      scope: readArtifact<Scope>(run, 'flows-scope').data,
    }),
};
