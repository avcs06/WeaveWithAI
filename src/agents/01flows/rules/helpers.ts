import type { Scope } from '../01scope/schema';
import type { Catalog } from '../02catalog/schema';
import type { Alternative, Flow, Flows, Step } from '../schema';

export type FlowInput = { flows: Flows; scope: Scope };

/** Every step of every flow, the alternatives' included, with the flow it belongs to. */
export function* eachStep(
  flows: Flows,
): Generator<{ flow: Flow; step: Step }> {
  for (const flow of flows.flows) {
    for (const step of flow.steps) yield { flow, step };
    // A path changes no records.
    for (const alternative of flow.alternatives)
      for (const step of alternative.steps)
        yield { flow, step: { ...step, effects: [] } };
  }
}

export const alternativesFrom = (flow: Flow, stepId: string): Alternative[] =>
  flow.alternatives.filter((alternative) => alternative.from === stepId);

export const idNumber = (id: string): number => Number(id.replace(/^\D+/, ''));

export type CatalogInput = { catalog: Catalog; scope: Scope };

/** A catalog seen as a flows document with no steps yet, so the flow rules that need no steps can run on it. */
export const catalogAsFlows = (catalog: Catalog): Flows => ({
  ...catalog,
  flows: catalog.flows.map(({ description: _description, ...header }) => ({
    ...header,
    steps: [],
    alternatives: [],
  })),
});
