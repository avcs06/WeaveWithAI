import type { Scope } from '../../01flows/01scope/schema';
import type { Flows, Step } from '../../01flows/schema';
import type { Contract } from '../schema';

// What the contract rules (CONTRACT-0NN) read.

export type ContractInput = { contract: Contract; scope: Scope; flows: Flows };

/** Every step of every flow, the alternatives' included. */
export const allSteps = (flows: Flows): Step[] =>
  flows.flows.flatMap((flow) => [
    ...flow.steps,
    ...flow.alternatives.flatMap((alternative) => alternative.steps),
  ]);
