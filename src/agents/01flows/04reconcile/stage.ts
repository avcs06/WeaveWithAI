import { readArtifact } from '../../../core/artifacts';
import type { Draft } from '../../../runner/runSpecStage';
import type { StageContext, StageDef } from '../../stages';
import { Scope } from '../01scope/schema';
import { terminalAsk } from '../answers';
import { inputs, produce } from '../produce';
import { flowsSystemPrompt } from '../prompts/index';
import { Flows } from '../schema';
import { reconcileCompose } from './compose';
import { patchUserMessage } from './prompts/index';
import { renderFlows } from './render';
import { validateFlows } from './validation/validation';

// The model's own reasoning level overran even the catalog's budget on the freelancer idea; medium keeps room for the JSON (D1.13).
const FLOWS_EFFORT = 'medium';

/** Stage 3: starts from the draft, validates the whole document, and patches until the validators are clean. */
async function runReconcile(ctx: StageContext): Promise<void> {
  const { run } = ctx;
  const { idea, scope, answers } = inputs(ctx);
  const envelope = readArtifact<Flows>(run, 'flows-expand');
  const draft = envelope.data;
  const system = flowsSystemPrompt(answers);
  const start: Draft<Flows> = {
    data: draft,
    raw: JSON.stringify(draft),
    model: envelope.meta.model ?? 'none',
  };
  await produce(
    ctx,
    {
      stage: 'flows-reconcile',
      schema: Flows,
      schemaName: 'Flows',
      system,
      user: patchUserMessage(idea, scope, draft, 'None yet.', 'None.'),
      validate: (flows) => validateFlows(flows, scope),
      ask: ctx.interactive ? terminalAsk(answers) : undefined,
      compose: reconcileCompose(
        { system, idea, scope, reasoningEffort: FLOWS_EFFORT },
        'flows-patch',
      ),
      start,
    },
    {
      artifact: 'flows-reconcile',
      inputs: ['flows-scope', 'flows-catalog', 'flows-expand'],
      render: (flows) => renderFlows(flows, scope),
    },
  );
}

export const reconcileStage: StageDef = {
  name: 'flows-reconcile',
  produces: ['flows-reconcile'],
  run: runReconcile,
  validate: (run) =>
    validateFlows(
      readArtifact<Flows>(run, 'flows-reconcile').data,
      readArtifact<Scope>(run, 'flows-scope').data,
    ),
};
