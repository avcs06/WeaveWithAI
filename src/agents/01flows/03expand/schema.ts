import { z } from 'zod';
import { Field, Flow, Form, Subflow } from '../schema';

/** What one expansion call returns for its batch of flows; parts it had to add beyond the catalog. */
export const FlowBatch = z.object({
  flows: z.array(Flow),
  newFields: z.array(Field),
  newForms: z.array(Form),
  newSubflows: z.array(Subflow),
});

export type FlowBatch = z.infer<typeof FlowBatch>;
