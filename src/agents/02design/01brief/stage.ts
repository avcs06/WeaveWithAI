import { readFileSync } from 'node:fs';
import { readArtifact, writeArtifact } from '../../../core/artifacts';
import { runPath } from '../../../core/run';
import { runSpecStage } from '../../../runner/runSpecStage';
import type { Scope } from '../../01flows/01scope/schema';
import type { StageContext, StageDef } from '../../stages';
import {
  briefReviewGuides,
  briefSystemPrompt,
  briefUserMessage,
} from './prompts/index';
import { Brief } from './schema';
import { validateBrief } from './validation/validation';

// Reasoning tokens count toward the budget (D1.13): the brief reasons at high.
const BRIEF_MAX_TOKENS = 16_384;

// The brief sets the direction, so it reasons longer and drafts more openly than the theme, which turns it into values (D1.13 C).
const BRIEF_EFFORT = 'high';

const BRIEF_TEMPERATURE = 0.7;

// A better first draft leaves fewer issues for the fixes, so it runs on the strong model (user, 2026-10-30).
const BRIEF_DRAFT_MODEL = 'strong';

/** The brief call: the app's direction from the idea and the scope. */
export async function runBrief(ctx: StageContext): Promise<void> {
  const { run, llm } = ctx;
  const idea = readFileSync(runPath(run, 'input', 'idea.md'), 'utf8');
  const scope = readArtifact<Scope>(run, 'flows-scope').data;
  const result = await runSpecStage({
    run,
    llm,
    stage: 'design-brief',
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
  writeArtifact(run, 'design-brief', result.output, {
    stage: 'design-brief',
    model: result.model,
    rounds: result.rounds,
    inputs: ['flows-scope'],
  });
}

export const briefStage: StageDef = {
  name: 'design-brief',
  produces: ['design-brief'],
  run: runBrief,
  validate: (run) =>
    validateBrief(
      readArtifact<Brief>(run, 'design-brief').data,
      readArtifact<Scope>(run, 'flows-scope').data,
    ),
};
