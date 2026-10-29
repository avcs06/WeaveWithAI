import { z } from 'zod';
import { CAPABILITY_IDS } from '../../config/capabilities';

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
  example: z.string(),
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
  id: z.string().describe('F01.S01, or SF01.S01 inside a subflow'),
  kind: z.enum(['user', 'system']),
  userAction: z.string().describe('"" for system steps and subflow steps'),
  websiteResponse: z
    .string()
    .describe('What the user can see, or what changes; "" for subflow steps'),
  fields: z
    .array(z.string())
    .describe('Ids of catalog fields the user fills in here; [] if none'),
  form: z
    .string()
    .describe('A form id whose fields the user fills in here, or ""'),
  subflow: z
    .string()
    .describe('A subflow id this step runs instead of its own text, or ""'),
  effects: z.array(Effect).describe('[] when nothing is stored or loaded'),
});

export const Alternative = z.object({
  id: z.string().describe('F01.A01, or SF01.A01 inside a subflow'),
  from: z.string().describe('The step ID it branches from'),
  kind: z.enum(ALTERNATIVE_KINDS),
  condition: z.string(),
  websiteResponse: z.string(),
  resumesAt: z
    .string()
    .describe('Step ID the user returns to, or "" if the flow ends'),
});

/** A step sequence two or more flows share, such as confirming a delete; a flow step runs it by id. */
export const Subflow = z.object({
  id: z.string().describe('SF01, SF02, ...'),
  name: z.string(),
  steps: z.array(Step),
  alternatives: z.array(Alternative),
});

export const Flow = z.object({
  id: z.string().describe('F01'),
  name: z.string(),
  role: z.string().describe('A role id from the scope'),
  category: z.enum([
    'auth',
    'onboarding',
    'core',
    'manage',
    'browse',
    'settings',
    'admin',
  ]),
  authKind: z.enum(['none', 'signUp', 'signIn', 'signOut']),
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
  subflows: z.array(Subflow),
  assumptions: z
    .array(Assumption)
    .describe('New assumptions made while writing flows'),
  questions: z
    .array(Question)
    .describe('New questions; each has a default answer'),
});

// The catalog is the document minus the steps: a flow keeps everything but `steps` and `alternatives`,
// which branch from steps, and gets a `description` in their place.
export const FlowHeader = Flow.omit({ steps: true, alternatives: true }).extend(
  {
    description: z.string().describe('What the flow does, one paragraph'),
  },
);
export const Catalog = Flows.extend({ flows: z.array(FlowHeader) });

/** What one expansion call returns for its batch of flows; parts it had to add beyond the catalog. */
export const FlowBatch = z.object({
  flows: z.array(Flow),
  newFields: z.array(Field),
  newForms: z.array(Form),
  newSubflows: z.array(Subflow),
});

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

export type Scope = z.infer<typeof Scope>;
export type Flows = z.infer<typeof Flows>;
export type Catalog = z.infer<typeof Catalog>;
export type FlowHeader = z.infer<typeof FlowHeader>;
export type FlowBatch = z.infer<typeof FlowBatch>;
export type FlowsPatch = z.infer<typeof FlowsPatch>;
export type Assumption = z.infer<typeof Assumption>;
export type Question = z.infer<typeof Question>;
export type Field = z.infer<typeof Field>;
export type Form = z.infer<typeof Form>;
export type Subflow = z.infer<typeof Subflow>;
export type Effect = z.infer<typeof Effect>;
export type Step = z.infer<typeof Step>;
export type Alternative = z.infer<typeof Alternative>;
export type Flow = z.infer<typeof Flow>;

/** Flows and subflows alike: something with steps and alternatives, for rules and renderers. */
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
