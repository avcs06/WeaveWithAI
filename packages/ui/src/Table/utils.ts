import type { TableColumnData } from './Table.types';

/**
 * The `dataKey` value, passed through `computed(value, row)` when there is
 * one; display-only columns have no value.
 */
export const getCellValue = (column: TableColumnData, row: unknown) => {
  const value = column.dataKey
    ? (row as Record<string, unknown>)[column.dataKey]
    : undefined;
  return column.computed ? column.computed(value, row) : value;
};
