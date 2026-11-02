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
import { sharedStage } from './04code/03shared/stage';
import { framesStage } from './04code/04frames/stage';
import { pagesStage } from './04code/05pages/stage';

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
  'design-theme',
  'design-architect',
  'contract',
  'code-scaffold',
  'code-contract',
  'code-shared',
  'code-frames',
  'code-pages',
  'bench',
  'e2e',
  'repair',
];

/** Stages that read nothing of each other's, so they run side by side. None at the moment. */
export const SIDE_BY_SIDE: string[][] = [];

/** `order` in runs of stages that start together: each side-by-side group as one batch, every other stage alone. */
export function stageBatches(order: string[], groups = SIDE_BY_SIDE): string[][] {
  const batches: string[][] = [];
  for (const name of order) {
    const last = batches.at(-1);
    const group = groups.find((g) => g.includes(name));
    if (group && last?.length && group.includes(last[0] ?? '')) last.push(name);
    else batches.push([name]);
  }
  return batches;
}

export const stages: StageDef[] = [
  scopeStage,
  catalogStage,
  expandStage,
  themeStage,
  architectStage,
  contractStage,
  scaffoldStage,
  contractCodeStage,
  sharedStage,
  framesStage,
  pagesStage,
];
