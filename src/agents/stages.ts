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
  designCatalogStage,
  drawStage,
  frameStage,
  inventStage,
  screenStage,
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
  'design-catalog',
  'design-screen',
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

/** Stages that read nothing of each other's, so they run side by side: after the catalog, the layouts, components, widgets and frames (DS32). */
export const SIDE_BY_SIDE: string[][] = [
  ['design-screen', 'design-invent', 'design-draw', 'design-frame'],
];

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
  reconcileStage,
  briefStage,
  themeStage,
  architectStage,
  designCatalogStage,
  screenStage,
  inventStage,
  drawStage,
  frameStage,
  assembleStage,
];
