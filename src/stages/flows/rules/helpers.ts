import type { Alternative, Flow, Flows, Scope, Step } from '../schema';

export type FlowInput = { flows: Flows; scope: Scope };

export function* eachStep(flows: Flows): Generator<{ flow: Flow; step: Step }> {
  for (const flow of flows.flows)
    for (const step of flow.steps) yield { flow, step };
}

export const alternativesFrom = (flow: Flow, stepId: string): Alternative[] =>
  flow.alternatives.filter((alternative) => alternative.from === stepId);

/** Every prose field of a flow with the id it belongs to, for word scans. */
export function flowTexts(flow: Flow): { at: string; text: string }[] {
  return [
    { at: flow.id, text: `${flow.goal} ${flow.outcome}` },
    ...flow.steps.map((step) => ({
      at: step.id,
      text: `${step.userAction} ${step.websiteResponse}`,
    })),
    ...flow.alternatives.map((alternative) => ({
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

export const idNumber = (id: string): number => Number(id.slice(1));
