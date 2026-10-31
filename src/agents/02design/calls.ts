import { readArtifact } from '../../core/artifacts';
import type { Run } from '../../core/run';
import { updateStage } from '../../core/run';
import type { Inventory } from '../../ds/inventory';
import { runSpecStage, type SpecStageOptions } from '../../runner/runSpecStage';
import type { Scope } from '../01flows/01scope/schema';
import type { Flows } from '../01flows/schema';
import type { StageContext } from '../stages';
import type { Brief } from './01brief/schema';
import type { Theme } from './02theme/build';
import { layoutShells } from './02theme/shells';
import type { DesignContext } from './rules/helpers';

// What the design stages after the theme share: the artifacts every one of
// them reads, and how a stage that makes several model calls runs them.

/** Calls that run side by side in one stage. */
export const PARALLEL = 3;

/** The scope, the flows, the brief and the theme, the shells the theme's layouts make, and the context the rules read. */
export function designInputs(run: Run, inv: Inventory) {
  const scope = readArtifact<Scope>(run, 'flows-scope').data;
  const flows = readArtifact<Flows>(run, 'flows-reconcile').data;
  const brief = readArtifact<Brief>(run, 'design-brief').data;
  const theme = readArtifact<Theme>(run, 'design-theme').data;
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
