import type { TableAlign, TableColumnData } from './Table.types';

export const alignClasses: Record<TableAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

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

/** A JSX title has no text to name the column with; its id stands in. */
export const getColumnLabel = (column: TableColumnData) =>
  typeof column.title === 'string' ? column.title : column.id;

/**
 * Names a row in its controls' labels and announcements: its value in
 * `column` when that is text or a number, else its position.
 */
export const getRowLabel = (
  column: TableColumnData | undefined,
  row: unknown,
  position: number,
) => {
  const value = column ? getCellValue(column, row) : undefined;
  return typeof value === 'number' || (typeof value === 'string' && value)
    ? String(value)
    : `row ${position}`;
};
