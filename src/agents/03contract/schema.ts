import { z } from 'zod';

// The contract (specs/contracts.md): the records and operations behind every
// widget. Every field is required; "none" is "" or [].

/** Fields every record gets from the app, so no entity declares them. */
export const RECORD_FIELDS = ['id', 'createdAt', 'updatedAt'] as const;

export const FIELD_KINDS = [
  'string',
  'text',
  'email',
  'url',
  'phone',
  'int',
  'decimal',
  'money',
  'percent',
  'boolean',
  'date',
  'time',
  'datetime',
  'enum',
  'ref',
] as const;

export const EntityField = z.object({
  name: z
    .string()
    .describe('camelCase, as the widgets name it in their data; never id, createdAt or updatedAt'),
  kind: z.enum(FIELD_KINDS),
  enum: z.string().describe('Enum name when kind is enum; ""'),
  ref: z.string().describe('Entity name when kind is ref; ""'),
  list: z.boolean().describe('Many values, such as tags'),
  required: z.boolean(),
});

export const Entity = z.object({
  name: z.string().describe('PascalCase singular'),
  noun: z.string().describe('The vocabulary noun it implements'),
  fields: z.array(EntityField),
});

export const Enum = z.object({
  name: z.string().describe('PascalCase'),
  values: z.array(
    z.object({
      key: z.string().describe('snake_case'),
      label: z.string().describe('As users see it; matches the flow options'),
    }),
  ),
});

export const Input = z.object({
  field: z.string().describe('The id of the flow field the user fills in, such as FD03'),
  as: z
    .string()
    .describe('The entity field it sets, or on a list the field it filters by; "q" for a list search'),
});

export const Operation = z.object({
  id: z.string().describe('camelCase verb + noun, such as createProject or completeTask'),
  kind: z.enum(['list', 'get', 'create', 'update', 'delete', 'action']),
  entity: z.string(),
  summary: z.string(),
  inputs: z.array(Input).describe('What the user fills in that it takes; []'),
  flowSteps: z.array(z.string()).describe('The ids of the steps and alternatives it serves'),
});

export const WidgetSource = z.object({
  widget: z.string().describe('A widget id, such as W06'),
  reads: z
    .array(z.string())
    .describe('The ids of the list and get operations that load the records it shows'),
});

export const Contract = z.object({
  enums: z.array(Enum),
  entities: z.array(Entity),
  operations: z.array(Operation),
  widgets: z
    .array(WidgetSource)
    .describe('One entry for each widget that shows data or repeats over records'),
});

/** The key of each list's items, for patches in the fix rounds. */
export const CONTRACT_KEYS = { enums: 'name', entities: 'name', operations: 'id', widgets: 'widget' };

export type FieldKind = (typeof FIELD_KINDS)[number];
export type EntityField = z.infer<typeof EntityField>;
export type Entity = z.infer<typeof Entity>;
export type Enum = z.infer<typeof Enum>;
export type Input = z.infer<typeof Input>;
export type Operation = z.infer<typeof Operation>;
export type WidgetSource = z.infer<typeof WidgetSource>;
export type Contract = z.infer<typeof Contract>;
