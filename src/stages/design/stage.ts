import { readFileSync } from 'node:fs';
import { readArtifact, writeArtifact } from '../../core/artifacts';
import type { Issue } from '../../core/issues';
import { runPath } from '../../core/run';
import { type Draft, runSpecStage } from '../../core/runSpecStage';
import { type Inventory, inventory } from '../../ds/inventory';
import type { Flows, Scope } from '../flows/schema';
import type { StageContext, StageDef } from '../index';
import {
  briefReviewGuides,
  briefSystemPrompt,
  briefUserMessage,
  themeReviewGuides,
  themeSystemPrompt,
  themeUserMessage,
} from './prompt';
import { Brief } from './schema';
import { makeThemeSchema, type ThemeCall } from './schema-theme';
import { buildTheme, type Theme } from './theme';
import { validateBrief, validateTheme } from './validate';

// Reasoning tokens count toward the budget (D1.13): the brief reasons at high, and the theme writes every color, layout and default.
const BRIEF_MAX_TOKENS = 16_384;
const THEME_MAX_TOKENS = 16_384;
// The brief sets the direction, so it reasons longer and drafts more openly than the theme, which turns it into values (D1.13 C).
const BRIEF_EFFORT = 'high';
const BRIEF_TEMPERATURE = 0.7;
// A better first draft leaves fewer issues for the fixes, so it runs on the strong model (user, 2026-10-30).
const BRIEF_DRAFT_MODEL = 'strong';
const THEME_EFFORT = 'medium';

/** A call's last output as the document a rerun starts from. */
export const draftOf = <T>(data: T, model: string): Draft<T> => ({
  data,
  raw: JSON.stringify(data),
  model,
});

/** The brief call: the app's direction from the idea and the scope. */
export async function runBrief(ctx: StageContext): Promise<void> {
  const { run, llm } = ctx;
  const idea = readFileSync(runPath(run, 'input', 'idea.md'), 'utf8');
  const scope = readArtifact<Scope>(run, 'scope').data;
  const result = await runSpecStage({
    run,
    llm,
    stage: 'brief',
    schema: Brief,
    schemaName: 'Brief',
    system: briefSystemPrompt(),
    user: briefUserMessage(idea, scope),
    validate: (brief) => validateBrief(brief, scope),
    review: briefReviewGuides(),
    maxTokens: BRIEF_MAX_TOKENS,
    reasoningEffort: BRIEF_EFFORT,
    temperature: BRIEF_TEMPERATURE,
    draftModel: BRIEF_DRAFT_MODEL,
  });
  writeArtifact(run, 'brief', result.output, {
    stage: 'brief',
    model: result.model,
    rounds: result.rounds,
    inputs: ['scope'],
  });
}

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
  const brief = readArtifact<Brief>(run, 'brief').data;
  const scope = readArtifact<Scope>(run, 'scope').data;
  const flows = readArtifact<Flows>(run, 'flows').data;
  const current = seed && readArtifact<Theme>(run, 'theme');
  const result = await runSpecStage({
    run,
    llm,
    stage: 'theme',
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
  writeArtifact(run, 'theme', buildTheme(brief, result.output), {
    stage: 'theme',
    model: result.model,
    rounds: result.rounds,
    inputs: ['brief', 'scope', 'flows'],
  });
}

export const briefStage: StageDef = {
  name: 'brief',
  produces: ['brief'],
  run: runBrief,
  validate: (run) =>
    validateBrief(
      readArtifact<Brief>(run, 'brief').data,
      readArtifact<Scope>(run, 'scope').data,
    ),
};

export const themeStage: StageDef = {
  name: 'theme',
  produces: ['theme'],
  run: async (ctx) => runTheme(ctx, await inventory()),
};
