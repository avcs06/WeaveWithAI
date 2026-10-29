import type {
  Alternative,
  Catalog,
  Flows,
  Scope,
  Step,
  StepContainer,
} from '../schema';

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

/** Every prose field of a flow or subflow with the id it belongs to, for word scans. */
export function containerTexts(
  container: StepContainer & { goal?: string; outcome?: string },
): { at: string; text: string }[] {
  return [
    ...(container.goal !== undefined
      ? [
          {
            at: container.id,
            text: `${container.goal} ${container.outcome ?? ''}`,
          },
        ]
      : []),
    ...container.steps.map((step) => ({
      at: step.id,
      text: `${step.userAction} ${step.websiteResponse}`,
    })),
    ...container.alternatives.map((alternative) => ({
      at: alternative.id,
      text: `${alternative.condition} ${alternative.websiteResponse}`,
    })),
  ];
}

/** Scope and flow assumptions plus out-of-scope entries: where a deliberate gap is explained. */
export function explanations({ flows, scope }: FlowInput): string[] {
  return [
    ...scope.assumptions.map((assumption) => assumption.text),
    ...flows.assumptions.map((assumption) => assumption.text),
    ...scope.outOfScope.map(
      (entry) => `${entry.item} ${entry.reason} ${entry.placeholder}`,
    ),
  ];
}

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
