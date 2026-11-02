import { z } from 'zod';
import { FLOW_KINDS, Flow, Flows } from '../schema';

// A catalog flow is a flow's header with a description in place of its steps and alternatives.
export const FlowHeader = Flow.omit({ steps: true, alternatives: true }).extend(
  {
    description: z
      .string()
      .describe(
        'Everything the user does and sees from start to outcome, one paragraph; names forms and fields by id',
      ),
  },
);

/** A role, noun and kind the catalog walked and left without a flow on purpose. */
export const Skipped = z.object({
  role: z.string().describe('A role id from the scope'),
  noun: z.string().describe('A vocabulary noun, or ""'),
  kind: z.enum(FLOW_KINDS),
  reason: z.string(),
});

export const Catalog = Flows.extend({
  flows: z.array(FlowHeader),
  skipped: z
    .array(Skipped)
    .describe('Every role, noun and kind with no flow, and why'),
});

export type Catalog = z.infer<typeof Catalog>;

export type FlowHeader = z.infer<typeof FlowHeader>;

export type Skipped = z.infer<typeof Skipped>;
