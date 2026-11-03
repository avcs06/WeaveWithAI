import type { ArtifactName } from '../core/artifacts';
import type { Config } from '../core/env';
import type { Issue } from '../core/issues';
import type { Llm } from '../core/llm';
import type { Run } from '../core/run';
import {
  catalogStage,
  expandStage,
  scopeStage,
} from './01flows/stages';
import { architectStage, themeStage } from './02design/stages';
import { contractStage } from './03contract/stage';
import { scaffoldStage } from './04code/01scaffold/stage';
import { contractCodeStage } from './04code/02contract/stage';
import { framesStage } from './04code/03frames/stage';
import { pagesStage } from './04code/04pages/stage';
import type { UnitSpec } from './04code/unit';

export type StageContext = {
  run: Run;
  config: Config;
  llm: Llm;
  interactive: boolean;
  backend: string;
  /** The code stage `weave run --round` resumes, at the round `weave session-resume` saved. */
  resume?: { stage: string; round: number };
};

export type StageDef = {
  name: string;
  /** Artifacts the stage writes; staleness is judged on them. Empty for stages that write other files. */
  produces: ArtifactName[];
  run(ctx: StageContext): Promise<void>;
  /** Reruns the stage's validators on the artifacts on disk, for `weave validate`. */
  validate?(run: Run): Issue[];
  /** A code stage's coding units, which `weave session-resume` resumes a cut session of. */
  units?(ctx: StageContext): UnitSpec[];
};

export const PIPELINE: string[] = [
  'flows-scope',
  'flows-catalog',
  'flows-expand',
  'design-theme',
  'design-architect',
  'contract',
  'code-scaffold',
  'code-contract',
  'code-frames',
  'code-pages',
  'bench',
  'e2e',
  'repair',
];

export const stages: StageDef[] = [
  scopeStage,
  catalogStage,
  expandStage,
  themeStage,
  architectStage,
  contractStage,
  scaffoldStage,
  contractCodeStage,
  framesStage,
  pagesStage,
];
