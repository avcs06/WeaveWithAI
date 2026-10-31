import type { z } from 'zod';
import { type PatchKeys, patchSchema } from '../../../runner/patch';
import { Flows } from '../schema';

/** Every list of the flows document, by id. */
export const FLOWS_KEYS: PatchKeys = {
  flows: 'id',
  fields: 'id',
  forms: 'id',
  subflows: 'id',
  assumptions: 'id',
  questions: 'id',
};

/** What a reconciliation call returns: only what changes. */
export const FlowsPatch = patchSchema(Flows, FLOWS_KEYS);

export type FlowsPatch = z.infer<typeof FlowsPatch>;
