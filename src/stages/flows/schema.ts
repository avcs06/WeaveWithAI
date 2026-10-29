import { z } from 'zod';
import { CAPABILITY_IDS } from '../../config/capabilities';

// Every field is required; "none" is "", [] or null. Nesting stays within 8 levels (Meta allows 10).

export const FIELD_TYPES = [
  'text', 'longText', 'email', 'password', 'url', 'phone',
  'integer', 'decimal', 'money', 'percent',
  'date', 'time', 'datetime', 'boolean', 'singleChoice', 'multiChoice',
] as const;
export const CHANGES = ['create', 'list', 'read', 'update', 'delete'] as const;
export const ALTERNATIVE_KINDS = [
  'invalid', 'failure', 'empty', 'cancel', 'confirm', 'denied', 'notFound', 'conflict', 'other',
] as const;

export const Assumption = z.object({
  id: z.string().describe('A01, A02, ...'),
  text: z.string(),
  kind: z.enum(['scope', 'permission', 'behavior', 'data', 'presentation']),
  affects: z.array(z.string()).describe('Flow or step IDs it affects; [] while scoping'),
});

export const Question = z.object({
  id: z.string().describe('Q01, Q02, ...'),
  question: z.string(),
  whyItMatters: z.string(),
  defaultAnswer: z.string().describe('What will be assumed if nobody answers'),
  blocking: z.boolean().describe('True only if the answer changes scope, permissions, business rules or data'),
});

export const Scope = z.object({
  app: z.object({
    name: z.string(),
    summary: z.string().describe('Who it is for, the problem, the core loop: 2 to 4 sentences'),
    audience: z.string(),
  }),
  roles: z.array(z.object({
    id: z.string().describe('camelCase, e.g. member'),
    name: z.string(),
    description: z.string(),
    signedIn: z.boolean(),
  })),
  vocabulary: z.array(z.object({
    noun: z.string().describe('PascalCase singular, e.g. Project'),
    description: z.string(),
    belongsTo: z.string().describe('Role id that owns these records, or "shared"'),
  })),
  capabilities: z.array(z.object({
    id: z.enum(CAPABILITY_IDS),
    needed: z.boolean(),
    note: z.string(),
  })),
  inScope: z.array(z.string()),
  outOfScope: z.array(z.object({ item: z.string(), reason: z.string(), placeholder: z.string() })),
  assumptions: z.array(Assumption),
  questions: z.array(Question),
});

export const Field = z.object({
  name: z.string().describe('camelCase; the same name means the same thing in every flow'),
  label: z.string(),
  meaning: z.string().describe('What the value means to the business'),
  type: z.enum(FIELD_TYPES),
  required: z.boolean(),
  minLength: z.number().int().nullable(),
  maxLength: z.number().int().nullable(),
  min: z.number().nullable(),
  max: z.number().nullable(),
  options: z.array(z.string()).describe('Choice types only; [] otherwise'),
  example: z.string(),
});

export const Effect = z.object({
  noun: z.string().describe('A noun from the scope vocabulary'),
  change: z.enum(CHANGES),
});

export const Step = z.object({
  id: z.string().describe('F01.S01'),
  kind: z.enum(['user', 'system']),
  userAction: z.string().describe('"" for system steps'),
  websiteResponse: z.string().describe('What the user can see, or what changes'),
  fields: z.array(Field).describe('Every field the user fills in at this step; [] if none'),
  effects: z.array(Effect).describe('[] when nothing is stored or loaded'),
});

export const Alternative = z.object({
  id: z.string().describe('F01.A01'),
  from: z.string().describe('The step ID it branches from'),
  kind: z.enum(ALTERNATIVE_KINDS),
  condition: z.string(),
  websiteResponse: z.string(),
  resumesAt: z.string().describe('Step ID the user returns to, or "" if the flow ends'),
});

export const Flow = z.object({
  id: z.string().describe('F01'),
  name: z.string(),
  role: z.string().describe('A role id from the scope'),
  category: z.enum(['auth', 'onboarding', 'core', 'manage', 'browse', 'settings', 'admin']),
  authKind: z.enum(['none', 'signUp', 'signIn', 'signOut']),
  goal: z.string(),
  preconditions: z.array(z.string()),
  steps: z.array(Step),
  alternatives: z.array(Alternative),
  outcome: z.string().describe('What changed and what is still there after a refresh'),
});

export const Flows = z.object({
  flows: z.array(Flow),
  assumptions: z.array(Assumption).describe('New assumptions made while writing flows'),
  questions: z.array(Question).describe('New questions; each has a default answer'),
});

export type Scope = z.infer<typeof Scope>;
export type Flows = z.infer<typeof Flows>;
export type Assumption = z.infer<typeof Assumption>;
export type Question = z.infer<typeof Question>;
export type Field = z.infer<typeof Field>;
export type Effect = z.infer<typeof Effect>;
export type Step = z.infer<typeof Step>;
export type Alternative = z.infer<typeof Alternative>;
export type Flow = z.infer<typeof Flow>;
