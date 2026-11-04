import { defineRule } from '../../../../../core/rules';
import type { SeedInput } from './seed-001-refs';

/** Each time kind's ISO 8601 form, with the example the prompt gives. */
const FORMATS: Record<string, [RegExp, string]> = {
  date: [/^\d{4}-\d{2}-\d{2}$/, '2026-03-14'],
  datetime: [/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/, '2026-03-14T10:30:00.000Z'],
  time: [/^\d{2}:\d{2}$/, '10:30'],
};

/**
 * SEED-004 · mandatory
 * Dates, datetimes and times are ISO 8601; an optional one may be "".
 * Pass: a date of "2026-03-14".
 * Fail: a date of "March 14".
 */
export const rule = defineRule<SeedInput>('SEED-004', 'mandatory', ({ seed, contract }, fail) =>
  contract.entities.flatMap((entity) =>
    (seed[entity.name] ?? []).flatMap((row, i) =>
      entity.fields.flatMap((field) => {
        const format = FORMATS[field.kind];
        if (!format) return [];
        const values = ([] as unknown[]).concat(row[field.name] ?? []);
        return values
          .filter((value) => !(value === '' && !field.required) && !format[0].test(String(value)))
          .map((value) =>
            fail(`${entity.name} row ${i + 1} has ${field.name} "${String(value)}". Write a ${field.kind} like ${format[1]}.`, `${entity.name}[${i}].${field.name}`),
          );
      }),
    ),
  ),
);
