import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import type { Contract } from '../../../../03contract/schema';
import type { SeedRows } from '../../schema';

export type SeedInput = { seed: SeedRows; contract: Contract };

/**
 * SEED-001 · mandatory
 * Every ref in the seed names a row that exists: a number from 1 to the row
 * count of the entity it points to.
 * Pass: a Project's client is 2 with three Client rows.
 * Fail: a Project's client is 4 with three Client rows.
 */
export const rule = defineRule<SeedInput>('SEED-001', 'mandatory', ({ seed, contract }, fail) => {
  const issues: Issue[] = [];
  for (const entity of contract.entities)
    for (const field of entity.fields.filter((f) => f.kind === 'ref')) {
      const count = seed[field.ref]?.length ?? 0;
      (seed[entity.name] ?? []).forEach((row, i) => {
        const value = row[field.name];
        for (const n of Array.isArray(value) ? value : [value])
          if (!Number.isInteger(n) || (n as number) < 1 || (n as number) > count)
            issues.push(
              fail(
                `${entity.name} row ${i + 1} has ${field.name} ${String(n)}, but ${field.ref} has ${count} rows. Give a row number from 1 to ${count}.`,
                `${entity.name}[${i}].${field.name}`,
              ),
            );
      });
    }
  return issues;
});
