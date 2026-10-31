import { readFileSync } from 'node:fs';
import { readArtifact } from '../../../core/artifacts';
import { runPath } from '../../../core/run';
import type { StageContext, StageDef } from '../../stages';
import { readAnswers, terminalAsk } from '../answers';
import { produce } from '../produce';
import {
  scopeReviewGuides,
  scopeSystemPrompt,
  scopeUserMessage,
} from './prompts/index';
import { renderScope } from './render';
import { Scope } from './schema';
import { validateScope } from './validation/validation';

// Reasoning tokens count toward the budget (D1.13).
const SCOPE_MAX_TOKENS = 16_384;

// Scope sets the app's direction, so it reasons longer and samples more openly than the calls that follow it (D1.13).
const SCOPE_EFFORT = 'high';

const SCOPE_TEMPERATURE = 0.7;

// For the same reason its first draft runs on the strong model (user, 2026-10-30).
const SCOPE_DRAFT_MODEL = 'strong';

async function runScope(ctx: StageContext): Promise<void> {
  const idea = readFileSync(runPath(ctx.run, 'input', 'idea.md'), 'utf8');
  const answers = readAnswers(ctx.run);
  await produce(
    ctx,
    {
      stage: 'flows-scope',
      schema: Scope,
      schemaName: 'Scope',
      system: scopeSystemPrompt(answers),
      user: scopeUserMessage(idea),
      validate: validateScope,
      review: scopeReviewGuides(),
      ask: ctx.interactive ? terminalAsk(answers) : undefined,
      maxTokens: SCOPE_MAX_TOKENS,
      reasoningEffort: SCOPE_EFFORT,
      temperature: SCOPE_TEMPERATURE,
      draftModel: SCOPE_DRAFT_MODEL,
    },
    { artifact: 'flows-scope', inputs: [], render: renderScope },
  );
}

export const scopeStage: StageDef = {
  name: 'flows-scope',
  produces: ['flows-scope'],
  run: runScope,
  validate: (run) => validateScope(readArtifact<Scope>(run, 'flows-scope').data),
};
