import { z } from 'zod';
import { Field, Flow, Form } from '../schema';

/** What one expansion call returns for its flow; parts it had to add beyond the catalog. */
export const FlowBatch = z.object({
  flows: z.array(Flow),
  newFields: z.array(Field),
  newForms: z.array(Form),
});

export type FlowBatch = z.infer<typeof FlowBatch>;
