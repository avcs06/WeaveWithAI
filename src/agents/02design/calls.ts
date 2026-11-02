import { readArtifact } from '../../core/artifacts';
import type { Run } from '../../core/run';
import { updateStage } from '../../core/run';
import type { Inventory } from '../../ds/inventory';
import { runSpecStage, type SpecStageOptions } from '../../runner/runSpecStage';
import type { Scope } from '../01flows/01scope/schema';
import type { Flows } from '../01flows/schema';
import type { StageContext } from '../stages';
import type { Themed } from './01theme/build';
import type { Processed as Plan } from './02architect/process';
import type { Processed as Catalog } from './03catalog/process';
import { layoutShells } from './01theme/shells';
import type { DesignContext } from './rules/helpers';

// What the design stages after the theme share: the artifacts every one of
// them reads, and how a stage that makes several model calls runs them.

/** Calls that run side by side in one stage. */
export const PARALLEL = 3;

/** The scope, the flows, the brief and the theme, the shells the theme's layouts make, and the context the rules read. */
export function designInputs(run: Run, inv: Inventory) {
  const scope = readArtifact<Scope>(run, 'flows-scope').data;
  const flows = readArtifact<Flows>(run, 'flows-expand').data;
  const { brief, theme } = readArtifact<Themed>(run, 'design-theme').data;
  const shells = layoutShells(theme.layouts);
  const context: DesignContext = {
    scope,
    flows,
    inventory: inv,
    shells,
    defaults: theme.defaults,
  };
  return { scope, flows, brief, theme, shells, context };
}

/** The page kind a part is drawn for: marketing only when every screen that shows it, or a widget holding it, is marketing. */
export function kindOf(part: string, plan: Plan, catalog: Catalog): 'app' | 'marketing' {
  const holders = catalog.widgets.filter((w) => w.newComponents.includes(part)).map((w) => w.id);
  const screens = catalog.screens
    .filter((s) => s.parts.some((p) => p === part || holders.includes(p)))
    .map((s) => s.screen);
  const kinds = plan.screens.filter((s) => screens.includes(s.id)).map((s) => s.kind);
  return kinds.length && kinds.every((k) => k === 'marketing') ? 'marketing' : 'app';
}

/** A call's output and the model that wrote it, which a fix starts from. */
export type Built<T> = { output: T; model: string };

/** Model calls of one stage, each a child stage done in the state under its own name, with their rounds and known issues summed. */
export function caller(ctx: StageContext) {
  let rounds = 0;
  let known = 0;
  const call = async <T>(
    options: Omit<SpecStageOptions<T>, 'run' | 'llm'>,
  ): Promise<Built<T>> => {
    const result = await runSpecStage({
      run: ctx.run,
      llm: ctx.llm,
      ...options,
    });
    updateStage(ctx.run, options.stage, { status: 'done' });
    rounds += result.rounds;
    known += result.known.length;
    return { output: result.output, model: result.model };
  };
  return { call, totals: () => ({ rounds, known }) };
}
