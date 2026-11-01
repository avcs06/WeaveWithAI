import { defineRule } from '../../../../../core/rules';
import type { SeedInput } from './seed-001-refs';

/**
 * SEED-003 · mandatory
 * A required field is never empty: not "" and, for a list, not [].
 * Pass: a Client row whose required name is "Asha Rao".
 * Fail: the same row with name "".
 */
export const rule = defineRule<SeedInput>('SEED-003', 'mandatory', ({ seed, contract }, fail) =>
  contract.entities.flatMap((entity) =>
    (seed[entity.name] ?? []).flatMap((row, i) =>
      entity.fields
        .filter((field) => field.required)
        .filter((field) => row[field.name] === '' || (Array.isArray(row[field.name]) && (row[field.name] as unknown[]).length === 0))
        .map((field) => fail(`${entity.name} row ${i + 1} leaves the required ${field.name} empty. Give it a realistic value.`, `${entity.name}[${i}].${field.name}`)),
    ),
  ),
);
