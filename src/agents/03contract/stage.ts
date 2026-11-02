import { writeFileSync } from 'node:fs';
import { markdownOf, readArtifact, writeArtifact } from '../../core/artifacts';
import { runPath } from '../../core/run';
import { runSpecStage } from '../../runner/runSpecStage';
import type { Scope } from '../01flows/01scope/schema';
import type { Flows } from '../01flows/schema';
import type { Architecture } from '../02design/02architect/schema';
import type { StageDef } from '../stages';
import { contractReviewGuides, contractSystemPrompt, contractUserMessage } from './prompts/index';
import { renderContract } from './render';
import { CONTRACT_KEYS, Contract } from './schema';
import { validateContract } from './validation/validation';

// The contract: one call once the architect has written the screens.
const CONTRACT_MAX_TOKENS = 32_768;
const CONTRACT_EFFORT = 'medium';

export const contractStage: StageDef = {
  name: 'contract',
  produces: ['contract'],
  async run({ run, llm }) {
    const scope = readArtifact<Scope>(run, 'flows-scope').data;
    const flows = readArtifact<Flows>(run, 'flows-expand').data;
    const architecture = readArtifact<Architecture>(run, 'design-architect').data;
    const result = await runSpecStage({
      run,
      llm,
      stage: 'contract',
      schema: Contract,
      schemaName: 'Contract',
      system: contractSystemPrompt(),
      user: contractUserMessage(scope, flows, architecture),
      validate: (contract) => validateContract(contract, { scope, flows }),
      review: contractReviewGuides(),
      maxTokens: CONTRACT_MAX_TOKENS,
      reasoningEffort: CONTRACT_EFFORT,
      patchKeys: CONTRACT_KEYS,
    });
    writeArtifact(run, 'contract', result.output, {
      stage: 'contract',
      model: result.model,
      rounds: result.rounds,
      inputs: ['flows-scope', 'flows-expand', 'design-architect'],
    });
    writeFileSync(runPath(run, markdownOf('contract')), renderContract(result.output, { scope, flows, architecture }));
  },
};
