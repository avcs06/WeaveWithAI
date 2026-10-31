import { readArtifact, writeArtifact } from '../../../core/artifacts';
import type { Issue } from '../../../core/issues';
import { inventory, type Inventory } from '../../../ds/inventory';
import { draftOf } from '../../../runner/draft';
import { runSpecStage } from '../../../runner/runSpecStage';
import type { Scope } from '../../01flows/01scope/schema';
import type { Flows } from '../../01flows/schema';
import type { StageContext, StageDef } from '../../stages';
import { Brief } from '../01brief/schema';
import { buildTheme, type Theme } from './build';
import {
  themeReviewGuides,
  themeSystemPrompt,
  themeUserMessage,
} from './prompts/index';
import { makeThemeSchema, type ThemeCall } from './schema';
import { validateTheme } from './validation/validation';

// Reasoning tokens count toward the budget (D1.13): the theme writes every color, layout and default.

const THEME_MAX_TOKENS = 16_384;

const THEME_EFFORT = 'medium';

/**
 * The theme call: every color, both page layouts and the component defaults,
 * from the brief. With `seed`, issues the design stage routed here, it starts
 * from the current theme and fixes them without reviewers (DS12).
 */
export async function runTheme(
  ctx: StageContext,
  inv: Inventory,
  seed?: Issue[],
): Promise<void> {
  const { run, llm } = ctx;
  const brief = readArtifact<Brief>(run, 'design-brief').data;
  const scope = readArtifact<Scope>(run, 'flows-scope').data;
  const flows = readArtifact<Flows>(run, 'flows-reconcile').data;
  const current = seed && readArtifact<Theme>(run, 'design-theme');
  const result = await runSpecStage({
    run,
    llm,
    stage: 'design-theme',
    schema: makeThemeSchema(brief, inv),
    schemaName: 'Theme',
    system: themeSystemPrompt(brief, inv),
    user: themeUserMessage(brief, scope, flows),
    // The rules read the built theme, so a failing contrast pair goes back to this call (D3.3 E).
    validate: (call) => validateTheme(buildTheme(brief, call), inv),
    review: seed ? undefined : themeReviewGuides(),
    maxTokens: THEME_MAX_TOKENS,
    reasoningEffort: THEME_EFFORT,
    ...(current && {
      start: draftOf<ThemeCall>(
        {
          colors: current.data.colors,
          layouts: current.data.layouts,
          defaults: current.data.defaults,
        },
        current.meta.model ?? 'none',
      ),
      seed,
    }),
  });
  writeArtifact(run, 'design-theme', buildTheme(brief, result.output), {
    stage: 'design-theme',
    model: result.model,
    rounds: result.rounds,
    inputs: ['design-brief', 'flows-scope', 'flows-reconcile'],
  });
}

export const themeStage: StageDef = {
  name: 'design-theme',
  produces: ['design-theme'],
  run: async (ctx) => runTheme(ctx, await inventory()),
};
