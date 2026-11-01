import { readArtifact, writeArtifact } from '../../../core/artifacts';
import { type Issue, writeReport } from '../../../core/issues';
import { appendEvent, updateStage } from '../../../core/run';
import { type Inventory, inventory } from '../../../ds/inventory';
import type { StageContext, StageDef } from '../../stages';
import type { Contract } from '../../03contract/schema';
import type { Processed as Plan } from '../02architect/process';
import type { Processed as Catalog } from '../03catalog/process';
import type { Laid } from '../04screen/stage';
import type { Invented } from '../05invent/stage';
import { type Drawn, fixWidgets } from '../06draw/stage';
import { fixFrames, type Framed } from '../07frame/stage';
import { designInputs } from '../calls';
import { assembleChain } from './assemble';
import { routeIssues } from './route';
import { skeleton } from './skeleton/skeleton';
import { validateDesign } from './validation/validation';
import { writeDesignFiles } from './write';

/**
 * The screens from the plan, the catalog, the layouts, the components, the
 * widgets and the frames, in code (DS23): `02-design/08-assemble.json`, the
 * skeleton, the wireframes, `02-design/08-assemble.md` and the gap report. An
 * issue on the assembled design goes back once to the draw or frame call that
 * built what it names, as a separately named fix; the rest are recorded as known.
 */
export async function runAssemble(
  ctx: StageContext,
  inv: Inventory,
  gapsLog = '.weave-cache/ds-gaps.jsonl',
): Promise<void> {
  const { run } = ctx;
  appendEvent(run, { type: 'stage:start', stage: 'design-assemble' });
  updateStage(run, 'design-assemble', { status: 'running' });
  const { scope, flows, brief, theme, context } = designInputs(run, inv);
  const plan = readArtifact<Plan>(run, 'design-architect').data;
  const catalog = readArtifact<Catalog>(run, 'design-catalog').data;
  const laid = readArtifact<Laid>(run, 'design-screen').data;
  const invented = readArtifact<Invented>(run, 'design-invent').data;
  const contract = readArtifact<Contract>(run, 'contract').data;
  const designs = new Map(invented.components.map((c) => [c.name, c.design]));

  const assemble = () => {
    const drawn = readArtifact<Drawn>(run, 'design-draw').data;
    const framed = readArtifact<Framed>(run, 'design-frame').data;
    const { screens, origin } = assembleChain(
      {
        plan,
        catalog,
        layouts: laid.calls.flatMap((c) => c.output.screens),
        designs,
        builds: drawn.widgets.map((w) => w.output),
        frames: framed.frames.map((frame) => frame.output),
      },
      theme,
    );
    const solved = skeleton(screens, inv);
    return {
      screens,
      origin,
      solved,
      issues: validateDesign(screens, solved, context, contract),
    };
  };
  let design = assemble();
  let rounds = 1;
  writeReport(run, 'design-assemble', 1, design.issues);

  const { calls } = routeIssues(design.issues, design.screens, design.origin);
  if (calls.size) {
    const widgets = new Map<string, Issue[]>();
    const frames = new Map<string, Issue[]>();
    for (const [owner, issues] of calls)
      (owner.startsWith('SH') ? frames : widgets).set(owner, issues);
    await Promise.all([
      widgets.size ? fixWidgets(ctx, inv, widgets) : undefined,
      frames.size ? fixFrames(ctx, inv, frames) : undefined,
    ]);
    design = assemble();
    rounds = 2;
    writeReport(run, 'design-assemble', 2, design.issues);
  }

  const { screens, solved, issues } = design;
  const known = issues.filter((issue) => issue.severity === 'mandatory').length;
  writeArtifact(run, 'design-assemble', screens, {
    stage: 'design-assemble',
    model: null,
    rounds,
    inputs: [
      'design-architect',
      'design-catalog',
      'design-screen',
      'design-invent',
      'design-draw',
      'design-frame',
      'design-theme',
      'contract',
      'flows-scope',
      'flows-reconcile',
    ],
  });
  writeDesignFiles(
    run,
    screens,
    skeleton(screens, inv, 'picture'),
    { brief, theme, flows, scope },
    gapsLog,
  );
  updateStage(run, 'design-assemble', { known });
  appendEvent(run, {
    type: 'stage:done',
    stage: 'design-assemble',
    rounds,
    known,
  });
}

export const assembleStage: StageDef = {
  name: 'design-assemble',
  produces: ['design-assemble'],
  run: async (ctx) => runAssemble(ctx, await inventory()),
};
