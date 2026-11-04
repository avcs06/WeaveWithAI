import { defineRule } from '../../../../../core/rules';
import type { SeedInput } from './seed-001-refs';

/**
 * SEED-002 · mandatory
 * Every entity has four to six seed rows.
 * Pass: four Client rows.
 * Fail: three Client rows.
 */
export const rule = defineRule<SeedInput>('SEED-002', 'mandatory', ({ seed, contract }, fail) =>
  contract.entities.flatMap((entity) => {
    const rows = seed[entity.name]?.length ?? 0;
    return rows >= 4 && rows <= 6 ? [] : [fail(`${entity.name} has ${rows} rows. Write four to six.`, entity.name)];
  }),
);
