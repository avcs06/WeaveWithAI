import { readArtifact, writeArtifact } from '../../../core/artifacts';
import { type Inventory, inventory } from '../../../ds/inventory';
import { runSpecStage } from '../../../runner/runSpecStage';
import type { StageContext, StageDef } from '../../stages';
import type { Processed as Plan } from '../03architect/process';
import { contentWidth } from '../05screen/width';
import { sizes } from '../09assemble/skeleton/boxes';
import { designInputs } from '../calls';
import { processCatalog } from './process';
import { catalogReviewGuides, catalogSystemPrompt, catalogUserMessage } from './prompts/index';
import { CATALOG_KEYS, makeCatalogSchema } from './schema';
import { validateCatalog } from './validation/validation';

// The catalog: one call for the whole app at medium reasoning and 0.2 (DS23).
const CATALOG_MAX_TOKENS = 65_536;
const CATALOG_EFFORT = 'medium';

/** The catalog's call: every widget defined once, each component's width range, and the parts of each screen. */
export async function runCatalog(ctx: StageContext, inv: Inventory): Promise<void> {
  const { run, llm } = ctx;
  const plan = readArtifact<Plan>(run, 'design-architect').data;
  const { scope, flows, theme, context } = designInputs(run, inv);
  const px = sizes(inv, []).spacing;
  const widths = Object.fromEntries(plan.screens.map((s) => [s.id, contentWidth(s, theme, inv)]));
  const widthOf = (screen: string) => widths[screen] ?? 0;
  const result = await runSpecStage({
    run,
    llm,
    stage: 'design-catalog',
    schema: makeCatalogSchema(inv).Catalog,
    schemaName: 'Catalog',
    system: catalogSystemPrompt(),
    user: catalogUserMessage(plan, flows, scope, widths),
    validate: (catalog) => validateCatalog(processCatalog(catalog, flows, px), plan, context, widthOf),
    review: catalogReviewGuides(),
    maxTokens: CATALOG_MAX_TOKENS,
    reasoningEffort: CATALOG_EFFORT,
    patchKeys: CATALOG_KEYS,
  });
  writeArtifact(run, 'design-catalog', processCatalog(result.output, flows, px), {
    stage: 'design-catalog',
    model: result.model,
    rounds: result.rounds,
    inputs: ['design-architect', 'design-theme', 'flows-scope', 'flows-reconcile'],
  });
}

export const designCatalogStage: StageDef = {
  name: 'design-catalog',
  produces: ['design-catalog'],
  run: async (ctx) => runCatalog(ctx, await inventory()),
};
