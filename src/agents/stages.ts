import type { ArtifactName } from '../core/artifacts';
import type { Config } from '../core/env';
import type { Issue } from '../core/issues';
import type { Llm } from '../core/llm';
import type { Run } from '../core/run';
import {
  catalogStage,
  expandStage,
  reconcileStage,
  scopeStage,
} from './01flows/stages';
import {
  architectStage,
  assembleStage,
  briefStage,
  drawStage,
  frameStage,
  inventStage,
  themeStage,
} from './02design/stages';

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
  'flows-scope',
  'flows-catalog',
  'flows-expand',
  'flows-reconcile',
  'design-brief',
  'design-theme',
  'design-architect',
  'design-invent',
  'design-draw',
  'design-frame',
  'design-assemble',
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

export const stages: StageDef[] = [
  scopeStage,
  catalogStage,
  expandStage,
  reconcileStage,
  briefStage,
  themeStage,
  architectStage,
  inventStage,
  drawStage,
  frameStage,
  assembleStage,
];
