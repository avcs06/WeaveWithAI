import { z } from 'zod';
import { CAPABILITY_IDS } from '../config/capabilities';
import { Assumption, Question } from '../schema';

export const Scope = z.object({
  app: z.object({
    name: z.string(),
    summary: z
      .string()
      .describe('Who it is for, the problem, the core loop: 2 to 4 sentences'),
    audience: z.string(),
  }),
  roles: z.array(
    z.object({
      id: z.string().describe('camelCase, e.g. member'),
      name: z.string(),
      description: z.string(),
      signedIn: z.boolean(),
    }),
  ),
  vocabulary: z.array(
    z.object({
      noun: z.string().describe('PascalCase singular, e.g. Project'),
      description: z.string(),
      belongsTo: z
        .string()
        .describe('Role id that owns these records, or "shared"'),
    }),
  ),
  capabilities: z.array(
    z.object({
      id: z.enum(CAPABILITY_IDS),
      needed: z.boolean(),
      note: z.string(),
    }),
  ),
  inScope: z.array(z.string()),
  outOfScope: z.array(
    z.object({ item: z.string(), reason: z.string(), placeholder: z.string() }),
  ),
  assumptions: z.array(Assumption),
  questions: z.array(Question),
});

export type Scope = z.infer<typeof Scope>;
