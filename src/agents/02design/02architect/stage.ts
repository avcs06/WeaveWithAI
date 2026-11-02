import { writeFileSync } from 'node:fs';
import {
  markdownOf,
  readArtifact,
  writeArtifact,
} from '../../../core/artifacts';
import { runPath } from '../../../core/run';
import type { PatchKeys } from '../../../runner/patch';
import { runSpecStage } from '../../../runner/runSpecStage';
import type { Scope } from '../../01flows/01scope/schema';
import type { Flows } from '../../01flows/schema';
import type { StageContext, StageDef } from '../../stages';
import type { Themed } from '../01theme/build';
import {
  architectReviewGuides,
  architectSystemPrompt,
  architectUserMessage,
} from './prompts/index';
import { renderArchitecture } from './render';
import { Architecture } from './schema';

// The architect writes every frame, screen and dialog in one call, at high
// reasoning; it starts at the client's 96k cap, so no
// cut is billed before a doubling.
const ARCHITECT_MAX_TOKENS = 98_304;
const ARCHITECT_EFFORT = 'high';

/** A fix returns only the frames, screens and dialogs it changes. */
const ARCHITECTURE_KEYS: PatchKeys = {
  frames: 'id',
  screens: 'id',
  dialogs: 'id',
};

/** The architect's call: the frames, screens and dialogs, in prose, from the flows. No validators yet: the reviewers catch what is wrong. */
async function runArchitect(ctx: StageContext): Promise<void> {
  const { run, llm } = ctx;
  const scope = readArtifact<Scope>(run, 'flows-scope').data;
  const flows = readArtifact<Flows>(run, 'flows-expand').data;
  const { brief, theme } = readArtifact<Themed>(run, 'design-theme').data;
  const result = await runSpecStage({
    run,
    llm,
    stage: 'design-architect',
    schema: Architecture,
    schemaName: 'Architecture',
    system: architectSystemPrompt(),
    user: architectUserMessage(scope, flows, brief, theme.layouts),
    validate: () => [],
    review: architectReviewGuides(),
    maxTokens: ARCHITECT_MAX_TOKENS,
    reasoningEffort: ARCHITECT_EFFORT,
    temperature: 0.2,
    patchKeys: ARCHITECTURE_KEYS,
  });
  writeArtifact(run, 'design-architect', result.output, {
    stage: 'design-architect',
    model: result.model,
    rounds: result.rounds,
    inputs: ['flows-scope', 'flows-expand', 'design-theme'],
  });
  writeFileSync(
    runPath(run, markdownOf('design-architect')),
    renderArchitecture(result.output, scope),
  );
}

export const architectStage: StageDef = {
  name: 'design-architect',
  produces: ['design-architect'],
  run: runArchitect,
};
