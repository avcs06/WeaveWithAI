import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { SchemaBridgeError, assertWithinLimits, toJsonSchema } from './schema';
import { keysOf } from './utils';

// Objects three deep (root, profile, address) with an array between the last two.
const Person = z.object({
  name: z.string(),
  profile: z.object({
    role: z.enum(['admin', 'member']),
    addresses: z.array(z.object({ street: z.string(), city: z.string() })),
  }),
});

/** Every key at every level, so a test can prove a key is gone. */
describe('toJsonSchema', () => {
  it('converts a nested object and reports its size', () => {
    const bridged = toJsonSchema(Person, 'person');
    expect(bridged.stats).toEqual({ depth: 4, properties: 6, enums: 1 });
    expect(bridged.schema).toMatchObject({
      type: 'object',
      additionalProperties: false,
    });
    expect(() => assertWithinLimits(bridged, { properties: 6 })).not.toThrow();
    expect(() => assertWithinLimits(bridged, { properties: 5 })).toThrow(
      /person has 6 properties/,
    );
    expect(() => assertWithinLimits(bridged, { enums: 1 })).not.toThrow();
    expect(() => assertWithinLimits(bridged, { enums: 0 })).toThrow(
      /person has 1 enums; the limit is 0/,
    );
  });

  it('throws SchemaBridgeError on a recursive schema', () => {
    type Node = { children: Node[] };
    const Node: z.ZodType<Node> = z.object({
      children: z.array(z.lazy(() => Node)),
    });
    const convert = () => toJsonSchema(Node, 'node');
    expect(convert).toThrow(SchemaBridgeError);
    expect(convert).toThrow(/node: Cycle detected/);
  });

  it('throws when the schema nests more than 10 levels', () => {
    let s: z.ZodType = z.object({ v: z.number() });
    for (let i = 0; i < 10; i += 1) s = z.object({ s });
    expect(() => toJsonSchema(s, 'deep')).toThrow(/deep nests 11 levels/);
  });

  it('rewrites oneOf to anyOf for a discriminated union', () => {
    const Shape = z.discriminatedUnion('kind', [
      z.object({ kind: z.literal('circle'), radius: z.number() }),
      z.object({ kind: z.literal('square'), side: z.number() }),
    ]);
    const { schema } = toJsonSchema(Shape, 'shape');
    expect(schema.anyOf).toHaveLength(2);
    expect(keysOf(schema)).not.toContain('oneOf');
  });

  it('drops the $schema key at the root', () => {
    expect(toJsonSchema(Person, 'person').schema).not.toHaveProperty('$schema');
  });
});
