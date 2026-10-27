import { isNil } from 'lodash-es';

import { getCellValue } from '../utils';

import type {
  TableColumnData,
  TableSortDirection,
  TableSortValue,
} from '../Table.types';

// A fixed locale: the runtime's default can differ between the server and the
// browser, which would order the rows differently.
const collator = new Intl.Collator('en-US', {
  numeric: true,
  sensitivity: 'base',
});

const toComparable = (value: unknown) =>
  value instanceof Date ? value.getTime() : value;

// NaN (and invalid dates) can't be ordered, so they sort with empty values.
const isEmptyValue = (value: unknown) =>
  isNil(value) || Number.isNaN(toComparable(value));

const compareValues = (a: unknown, b: unknown) => {
  const left = toComparable(a);
  const right = toComparable(b);
  if (typeof left === 'number' && typeof right === 'number')
    return left - right;
  if (typeof left === 'boolean' && typeof right === 'boolean')
    return Number(left) - Number(right);
  return collator.compare(String(left), String(right));
};

/** Stable sort; empty values stay last in both directions. */
export const sortRows = <T>(
  rows: readonly T[],
  column: TableColumnData,
  direction: TableSortDirection,
) => {
  const factor = direction === 'asc' ? 1 : -1;
  return rows
    .map((row) => ({ row, value: getCellValue(column, row) }))
    .sort((a, b) => {
      const aEmpty = isEmptyValue(a.value);
      const bEmpty = isEmptyValue(b.value);
      if (aEmpty || bEmpty) return Number(aEmpty) - Number(bEmpty);
      return factor * compareValues(a.value, b.value);
    })
    .map(({ row }) => row);
};

/** asc → desc → unsorted. */
export const getNextSort = (
  sort: TableSortValue,
  columnId: string,
): TableSortValue => {
  if (sort?.columnId !== columnId) return { columnId, direction: 'asc' };
  return sort.direction === 'asc' ? { columnId, direction: 'desc' } : null;
};
