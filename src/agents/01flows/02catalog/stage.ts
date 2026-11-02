import { readArtifact } from '../../../core/artifacts';
import type { StageContext, StageDef } from '../../stages';
import { Scope } from '../01scope/schema';
import { terminalAsk } from '../answers';
import { inputs, produce } from '../produce';
import { flowsSystemPrompt } from '../prompts/index';
import { catalogReviewGuides, catalogUserMessage } from './prompts/index';
import { renderCatalog } from './render';
import { Catalog } from './schema';
import { validateCatalog } from './validation/validation';

// Reasoning tokens count toward the budget; the catalog carries every header, part and skip.
const CATALOG_MAX_TOKENS = 32_768;

// The model's own reasoning level overran even the catalog's budget on the freelancer idea; medium keeps room for the JSON.
const FLOWS_EFFORT = 'medium';

/** Stage 1: every flow's header and description plus the fields and forms, through the runner like scope. */
async function runCatalog(ctx: StageContext): Promise<void> {
  const { idea, scope, answers } = inputs(ctx);
  await produce(
    ctx,
    {
      stage: 'flows-catalog',
      schema: Catalog,
      schemaName: 'FlowCatalog',
      system: flowsSystemPrompt(answers),
      user: catalogUserMessage(idea, scope),
      validate: (catalog) => validateCatalog(catalog, scope),
      review: catalogReviewGuides(),
      ask: ctx.interactive ? terminalAsk(answers) : undefined,
      maxTokens: CATALOG_MAX_TOKENS,
      reasoningEffort: FLOWS_EFFORT,
    },
    {
      artifact: 'flows-catalog',
      inputs: ['flows-scope'],
      render: (catalog) => renderCatalog(catalog, scope),
    },
  );
}

export const catalogStage: StageDef = {
  name: 'flows-catalog',
  produces: ['flows-catalog'],
  run: runCatalog,
  validate: (run) =>
    validateCatalog(
      readArtifact<Catalog>(run, 'flows-catalog').data,
      readArtifact<Scope>(run, 'flows-scope').data,
    ),
};
