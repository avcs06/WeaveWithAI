import { type ArtifactName, writeArtifact } from '../core/artifacts';
import type { Config } from '../core/env';
import type { Issue } from '../core/issues';
import type { Llm } from '../core/llm';
import type { Run } from '../core/run';

export type StageContext = {
  run: Run;
  config: Config;
  llm: Llm;
  interactive: boolean;
  backend: string;
};

export type StageDef = {
  name: string;
  /** Artifacts the stage writes; staleness is judged on them. Empty for stages that write other files. */
  produces: ArtifactName[];
  run(ctx: StageContext): Promise<void>;
  /** Reruns the stage's validators on the artifacts on disk, for `weave validate`. */
  validate?(run: Run): Issue[];
};

export const PIPELINE: string[] = [
  'scope',
  'flows',
  'design',
  'contract',
  'reconcile',
  'freeze',
  'scaffold',
  'codegen',
  'apitest',
  'frontend',
  'bench',
  'e2e',
  'repair',
];

// Stands in until FL5 wires the real scope stage, so `weave run` and `show` have a stage to walk.
const scopeStub: StageDef = {
  name: 'scope',
  produces: ['scope'],
  async run({ run }) {
    writeArtifact(run, 'scope', { stub: true }, { stage: 'scope', model: null, rounds: 0, inputs: [] });
  },
};

export const stages: StageDef[] = [scopeStub];
