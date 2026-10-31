import type { Scope } from '../01scope/schema';
import type { Catalog } from '../02catalog/schema';
import type { Alternative, Flows, Step, StepContainer } from '../schema';

export type FlowInput = { flows: Flows; scope: Scope };

/** Every step of every flow and every subflow, with the container it belongs to. */
export function* eachStep(
  flows: Flows,
): Generator<{ container: StepContainer; step: Step }> {
  for (const container of containers(flows))
    for (const step of container.steps) yield { container, step };
}

/** Flows first, then subflows: both have steps and alternatives. */
export const containers = (flows: Flows): StepContainer[] => [
  ...flows.flows,
  ...flows.subflows,
];

export const alternativesFrom = (
  container: StepContainer,
  stepId: string,
): Alternative[] =>
  container.alternatives.filter((alternative) => alternative.from === stepId);

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
