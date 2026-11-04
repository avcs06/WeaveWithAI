import { z } from 'zod';
import type { Contract, EntityField } from '../../03contract/schema';

/** Seed rows per entity name, as the seed call answers: a ref is the 1-based row number of the record it points to. */
export type SeedRows = Record<string, Record<string, unknown>[]>;

function fieldSchema(field: EntityField, contract: Contract): z.ZodType {
  const one = (() => {
    switch (field.kind) {
      case 'int':
        return z.number().int();
      case 'decimal':
      case 'money':
      case 'percent':
        return z.number();
      case 'boolean':
        return z.boolean();
      case 'enum': {
        const keys = contract.enums.find((e) => e.name === field.enum)?.values.map((v) => v.key) ?? [];
        return keys.length ? z.enum(keys as [string, ...string[]]) : z.string();
      }
      case 'ref':
        return z.number().int().describe(`The row number of the ${field.ref} it points to, 1 for the first`);
      default:
        return z.string().describe(field.required ? `A realistic ${field.kind}` : `A realistic ${field.kind}, or "" for none`);
    }
  })();
  return field.list ? z.array(one) : one;
}

/** One list of rows per entity, every field required, so the answer always has the record's whole shape. */
export function seedSchema(contract: Contract): z.ZodType<SeedRows> {
  return z.object(
    Object.fromEntries(
      contract.entities.map((entity) => [
        entity.name,
        z.array(z.object(Object.fromEntries(entity.fields.map((f) => [f.name, fieldSchema(f, contract)])))),
      ]),
    ),
  ) as unknown as z.ZodType<SeedRows>;
}
