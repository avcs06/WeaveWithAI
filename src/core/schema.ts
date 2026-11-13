import { z } from 'zod';

export class SchemaBridgeError extends Error {}

export type JsonSchema = Record<string, unknown>;
export type BridgedSchema = {
  name: string;
  schema: JsonSchema;
  stats: { depth: number; properties: number; enums: number };
};

export const MAX_DEPTH = 10;

/** Converts a zod schema to the JSON Schema Claude's structured outputs take in `output_config.format`. */
export function toJsonSchema(schema: z.ZodType, name: string): BridgedSchema {
  let raw: JsonSchema;
  try {
    raw = z.toJSONSchema(schema, {
      target: 'draft-2020-12',
      io: 'output',
      reused: 'inline',
      cycles: 'throw',
      unrepresentable: 'throw',
    }) as JsonSchema;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // First line only: zod's cycle hint says to switch to `$ref`s, which the API does not take.
    throw new SchemaBridgeError(`${name}: ${message.split('\n')[0]}`);
  }
  delete raw.$schema;
  const schemaOut = rewrite(raw) as JsonSchema;
  const bridged = { name, schema: schemaOut, stats: measure(schemaOut) };
  assertWithinLimits(bridged);
  return bridged;
}

export function assertWithinLimits(
  bridged: BridgedSchema,
  limits: { properties?: number; enums?: number } = {},
): void {
  const { name, stats } = bridged;
  if (stats.depth > MAX_DEPTH) {
    throw new SchemaBridgeError(
      `${name} nests ${stats.depth} levels; the limit is ${MAX_DEPTH}`,
    );
  }
  if (limits.properties !== undefined && stats.properties > limits.properties) {
    throw new SchemaBridgeError(
      `${name} has ${stats.properties} properties; the limit is ${limits.properties}`,
    );
  }
  if (limits.enums !== undefined && stats.enums > limits.enums) {
    throw new SchemaBridgeError(
      `${name} has ${stats.enums} enums; the limit is ${limits.enums}`,
    );
  }
}

// Structured outputs refuse these; zod checks them on the answer instead.
const UNSUPPORTED = new Set(['minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf', 'minLength', 'maxLength']);

/** Renames every `oneOf` to `anyOf`, the form structured outputs take, and drops the keywords they refuse. */
function rewrite(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(rewrite);
  if (!isRecord(node)) return node;
  const out: JsonSchema = {};
  for (const [key, value] of Object.entries(node)) {
    if (key === 'oneOf' || UNSUPPORTED.has(key)) continue;
    // Property names are the document's, not keywords.
    out[key] = key === 'properties' && isRecord(value)
      ? Object.fromEntries(Object.entries(value).map(([name, child]) => [name, rewrite(child)]))
      : rewrite(value);
  }
  if (Array.isArray(node.oneOf)) {
    const kept = Array.isArray(out.anyOf) ? out.anyOf : [];
    out.anyOf = [...kept, ...node.oneOf.map(rewrite)];
  }
  return out;
}

function measure(root: JsonSchema): BridgedSchema['stats'] {
  const stats = { depth: 0, properties: 0, enums: 0 };
  const visit = (node: unknown, level: number): void => {
    if (!isRecord(node)) return;
    if (Array.isArray(node.enum)) stats.enums += 1;
    // A union stands in for its holder, so its branches sit at the holder's level.
    for (const key of ['anyOf', 'allOf']) {
      const branches = node[key];
      if (Array.isArray(branches))
        for (const branch of branches) visit(branch, level);
    }
    if (!isContainer(node)) return;
    stats.depth = Math.max(stats.depth, level);
    if (isRecord(node.properties)) {
      const children = Object.values(node.properties);
      stats.properties += children.length;
      for (const child of children) visit(child, level + 1);
    }
    visit(node.items, level + 1);
    visit(node.additionalProperties, level + 1);
    if (Array.isArray(node.prefixItems))
      for (const item of node.prefixItems) visit(item, level + 1);
  };
  visit(root, 1);
  return stats;
}

function isContainer(node: JsonSchema): boolean {
  const types = Array.isArray(node.type) ? node.type : [node.type];
  return types.includes('object') || types.includes('array');
}

function isRecord(value: unknown): value is JsonSchema {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
