import { z } from 'zod';

// Every field is required; "none" is "", [] or null. Nesting stays within 8 levels (Meta allows 10).

export const FIELD_TYPES = [
  'text',
  'longText',
  'email',
  'password',
  'url',
  'phone',
  'integer',
  'decimal',
  'money',
  'percent',
  'date',
  'time',
  'datetime',
  'boolean',
  'singleChoice',
  'multiChoice',
] as const;

export const CHANGES = ['create', 'list', 'read', 'update', 'delete'] as const;

/** What a flow does for its role; the catalog walks every role, noun and kind so none is left out. */
export const FLOW_KINDS = [
  'landing',
  'auth',
  'home',
  'browse',
  'view',
  'create',
  'edit',
  'delete',
  'act',
  'account',
  'settings',
] as const;

export const ALTERNATIVE_KINDS = [
  'invalid',
  'failure',
  'empty',
  'cancel',
  'confirm',
  'denied',
  'notFound',
  'conflict',
  'other',
] as const;

export const Assumption = z.object({
  id: z.string().describe('A01, A02, ...'),
  text: z.string(),
  kind: z.enum(['scope', 'permission', 'behavior', 'data', 'presentation']),
  affects: z
    .array(z.string())
    .describe('Flow or step IDs it affects; [] while scoping'),
});

export const Question = z.object({
  id: z.string().describe('Q01, Q02, ...'),
  question: z.string(),
  whyItMatters: z.string(),
  defaultAnswer: z.string().describe('What will be assumed if nobody answers'),
  blocking: z
    .boolean()
    .describe(
      'True only when a wrong default would make the app wrong for its users',
    ),
});

export const Field = z.object({
  id: z.string().describe('FD01, FD02, ...; steps and forms refer to it'),
  label: z.string(),
  meaning: z.string().describe('What the value means to the business'),
  type: z.enum(FIELD_TYPES),
  required: z.boolean(),
  min: z
    .number()
    .nullable()
    .describe(
      'Shortest length for text types, smallest value for numbers; null when none',
    ),
  max: z
    .number()
    .nullable()
    .describe(
      'Longest length for text types, largest value for numbers; null when none',
    ),
  options: z.array(z.string()).describe('Choice types only; [] otherwise'),
  optionsFrom: z
    .string()
    .describe(
      'The vocabulary noun whose records are the choices, with options []; "" for fixed options',
    ),
  example: z
    .string()
    .describe('A realistic value as text, in quotes even for a number, a date or a yes or no: "60", "2026-11-03", "yes"'),
});

/** A group of fields one screen asks for, reused by every step that shows that form. */
export const Form = z.object({
  id: z.string().describe('FM01, FM02, ...'),
  name: z.string(),
  fields: z.array(z.string()).describe('Field ids from the catalog'),
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
  fields: z
    .array(z.string())
    .describe('Ids of catalog fields the user fills in here; [] if none'),
  form: z
    .string()
    .describe('A form id whose fields the user fills in here, or ""'),
  effects: z.array(Effect).describe('[] when nothing is stored or loaded'),
});

export const Alternative = z.object({
  id: z.string().describe('F01.A01'),
  from: z.string().describe('The step ID it branches from'),
  kind: z.enum(ALTERNATIVE_KINDS),
  condition: z.string(),
  websiteResponse: z.string(),
  resumesAt: z
    .string()
    .describe('Step ID the user returns to, or "" if the flow ends'),
});

export const Flow = z.object({
  id: z.string().describe('F01'),
  name: z.string(),
  role: z.string().describe('A role id from the scope'),
  kind: z.enum(FLOW_KINDS),
  noun: z
    .string()
    .describe(
      'The vocabulary noun the flow works on; "" for landing, auth, home, account and settings',
    ),
  authKind: z.enum(['none', 'signUp', 'signIn', 'signOut']),
  signedOut: z
    .boolean()
    .describe('True when the user is not signed in during the flow'),
  start: z.string().describe('Where the user is when the flow begins'),
  goal: z.string(),
  preconditions: z.array(z.string()),
  steps: z.array(Step),
  alternatives: z.array(Alternative),
  outcome: z
    .string()
    .describe('What changed and what is still there after a refresh'),
});

/** The flows artifact: flows plus the reusable parts every flow refers to by name. */
export const Flows = z.object({
  flows: z.array(Flow),
  fields: z.array(Field).describe('Every field, defined once'),
  forms: z.array(Form),
  assumptions: z
    .array(Assumption)
    .describe('New assumptions made while writing flows'),
  questions: z
    .array(Question)
    .describe('New questions; each has a default answer'),
});

export type Flows = z.infer<typeof Flows>;

export type Assumption = z.infer<typeof Assumption>;

export type Question = z.infer<typeof Question>;

export type Field = z.infer<typeof Field>;

export type Form = z.infer<typeof Form>;

export type Effect = z.infer<typeof Effect>;

export type Step = z.infer<typeof Step>;

export type Alternative = z.infer<typeof Alternative>;

export type Flow = z.infer<typeof Flow>;

/** Something with steps and alternatives, for rules and renderers. */
export type StepContainer = {
  id: string;
  steps: Step[];
  alternatives: Alternative[];
};

/** The fields a step asks for: its form's fields first, then its own, looked up by id. */
export function stepFields(
  step: Step,
  flows: Pick<Flows, 'fields' | 'forms'>,
): Field[] {
  const ids = [
    ...(flows.forms.find((form) => form.id === step.form)?.fields ?? []),
    ...step.fields,
  ];
  return ids.flatMap((id) => flows.fields.filter((field) => field.id === id));
}
