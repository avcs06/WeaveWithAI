import { z } from 'zod';
import { Assumption, Field, Flow, Form, Question, Subflow } from '../schema';

/** What a reconciliation call returns: only what changes. */
export const FlowsPatch = z.object({
  upsertFlows: z
    .array(Flow)
    .describe('Complete flows; the same id replaces, a new id adds'),
  upsertFields: z.array(Field),
  upsertForms: z.array(Form),
  upsertSubflows: z.array(Subflow),
  removeFlows: z.array(z.string()).describe('Flow ids to delete'),
  assumptions: z.array(Assumption).describe('New ones only'),
  questions: z.array(Question).describe('New ones only'),
});

export type FlowsPatch = z.infer<typeof FlowsPatch>;
