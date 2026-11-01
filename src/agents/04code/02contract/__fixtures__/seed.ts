import type { Contract, EntityField } from '../../../03contract/schema';
import type { SeedRows } from '../schema';

// Seed rows built from the contract alone, for tests and offline checks: three rows per entity, refs to row 1.

function value(field: EntityField, contract: Contract, row: number): unknown {
  const one = (() => {
    switch (field.kind) {
      case 'int':
      case 'decimal':
      case 'money':
      case 'percent':
        return row * 10;
      case 'boolean':
        return row % 2 === 0;
      case 'enum':
        return contract.enums.find((e) => e.name === field.enum)?.values[0]?.key ?? '';
      case 'ref':
        return 1;
      case 'date':
        return `2026-03-1${row}`;
      case 'datetime':
        return `2026-03-1${row}T10:00:00.000Z`;
      case 'time':
        return `1${row}:00`;
      default:
        return `${field.name} ${row}`;
    }
  })();
  return field.list ? [one] : one;
}

export function fakeSeed(contract: Contract): SeedRows {
  return Object.fromEntries(
    contract.entities.map((entity) => [
      entity.name,
      [1, 2, 3].map((row) => Object.fromEntries(entity.fields.map((f) => [f.name, value(f, contract, row)]))),
    ]),
  );
}
