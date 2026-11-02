import type { Scope } from '../../01flows/01scope/schema';
import type { Flows, Step } from '../../01flows/schema';
import type { Defined } from '../../02design/03catalog/process';
import type { Contract, Entity, Operation } from '../schema';

// What the contract rules (CONTRACT-0NN) read.

/** What the contract covers of a catalog widget: the steps it serves and the values it shows. */
export type Widget = Pick<Defined, 'id' | 'flowSteps' | 'data' | 'repeat'>;

export type ContractInput = { contract: Contract; scope: Scope; flows: Flows; widgets: Widget[] };

export type FlowStep = Step & { flow: string; authKind: string };

/** Every step of the flows, with the flow's id and auth kind. */
export function allSteps(flows: Flows): FlowStep[] {
  return flows.flows.flatMap((flow) =>
    flow.steps.map((step) => ({ ...step, flow: flow.id, authKind: flow.authKind })),
  );
}

export const entityOf = (contract: Contract, name: string): Entity | undefined =>
  contract.entities.find((entity) => entity.name === name);

export const serving = (contract: Contract, step: string): Operation[] =>
  contract.operations.filter((op) => op.flowSteps.includes(step));
