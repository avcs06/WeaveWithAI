import { z } from 'zod';
import { Flow, Flows } from '../schema';

// The catalog is the document minus the steps: a flow keeps everything but `steps` and `alternatives`,
// which branch from steps, and gets a `description` in their place.
export const FlowHeader = Flow.omit({ steps: true, alternatives: true }).extend(
  {
    description: z.string().describe('What the flow does, one paragraph'),
  },
);

export const Catalog = Flows.extend({ flows: z.array(FlowHeader) });

export type Catalog = z.infer<typeof Catalog>;

export type FlowHeader = z.infer<typeof FlowHeader>;
