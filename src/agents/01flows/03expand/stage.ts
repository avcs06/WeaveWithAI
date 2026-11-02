import { writeFileSync } from 'node:fs';
import {
  markdownOf,
  readArtifact,
  writeArtifact,
} from '../../../core/artifacts';
import { appendEvent, runPath, updateStage } from '../../../core/run';
import { runSpecStage } from '../../../runner/runSpecStage';
import type { StageContext, StageDef } from '../../stages';
import { Scope } from '../01scope/schema';
import { Catalog } from '../02catalog/schema';
import { inputs } from '../produce';
import { flowsSystemPrompt } from '../prompts/index';
import { Flows } from '../schema';
import {
  assemble,
  batchesOf,
  EXPAND_BATCH_SIZE,
  expandCompose,
} from './compose';
import { expandReviewGuides, expandUserMessage } from './prompts/index';
import { renderFlows } from './render';
import { FlowBatch } from './schema';
import { validateBatch, validateFlows } from './validation/validation';

// The model's own reasoning level overran even the catalog's budget on the freelancer idea; medium keeps room for the JSON (D1.13).
const FLOWS_EFFORT = 'medium';

/** Stage 2: each catalog flow expanded by its own call, all in parallel, assembled into the flows document. */
async function runExpand(ctx: StageContext): Promise<void> {
  const { run } = ctx;
  const { idea, scope, answers } = inputs(ctx);
  const catalog = readArtifact<Catalog>(run, 'flows-catalog').data;
  const system = flowsSystemPrompt(answers);
  appendEvent(run, { type: 'stage:start', stage: 'flows-expand' });
  updateStage(run, 'flows-expand', { status: 'running' });

  const batches = batchesOf(
    catalog.flows.map((flow) => flow.id),
    EXPAND_BATCH_SIZE,
  );
  const results = await Promise.all(
    batches.map((flowIds, i) => {
      const stage = `flows-expand-${i + 1}`;
      return runSpecStage<FlowBatch>({
        run,
        stage,
        schema: FlowBatch,
        schemaName: 'FlowBatch',
        system,
        user: expandUserMessage(idea, scope, catalog, flowIds),
        validate: (batch) => validateBatch(batch, catalog, scope),
        review: expandReviewGuides(),
        compose: expandCompose(
          { system, idea, scope, reasoningEffort: FLOWS_EFFORT },
          catalog,
          flowIds,
          stage,
        ),
        llm: ctx.llm,
      }).then((result) => {
        // The runner leaves the status to its caller; a batch has no artifact of its own, so it is done here.
        updateStage(run, stage, { status: 'done' });
        return result;
      });
    }),
  );
  const flows = Flows.parse(
    assemble(
      catalog,
      results.map((result) => result.output),
    ),
  );
  const rounds = results.reduce((sum, result) => sum + result.rounds, 0);
  const known = results.reduce((sum, result) => sum + result.known.length, 0);
  writeArtifact(run, 'flows-expand', flows, {
    stage: 'flows-expand',
    model: results[0]?.model ?? 'none',
    rounds,
    inputs: ['flows-scope', 'flows-catalog'],
  });
  writeFileSync(
    runPath(run, markdownOf('flows-expand')),
    renderFlows(flows, scope),
  );
  updateStage(run, 'flows-expand', { rounds, known, batches: batches.length });
  appendEvent(run, {
    type: 'stage:done',
    stage: 'flows-expand',
    rounds,
    known,
    batches: batches.length,
  });
}

export const expandStage: StageDef = {
  name: 'flows-expand',
  produces: ['flows-expand'],
  run: runExpand,
  validate: (run) =>
    validateFlows(
      readArtifact<Flows>(run, 'flows-expand').data,
      readArtifact<Scope>(run, 'flows-scope').data,
    ),
};
