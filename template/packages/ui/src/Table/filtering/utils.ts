import { isNil } from 'lodash-es';

import { getCellValue } from '../utils';

import type {
  TableColumnData,
  TableColumnFilterValue,
  TableFilterValue,
} from '../Table.types';

const matchesFilter = (value: unknown, filter: TableColumnFilterValue) => {
  switch (filter.type) {
    case 'text':
      return String(value ?? '')
        .toLowerCase()
        .includes(filter.contains.toLowerCase());
    case 'enum':
      return filter.in.includes(String(value));
    case 'number': {
      const number = isNil(value) ? NaN : Number(value);
      if (Number.isNaN(number)) return false;
      return (
        (isNil(filter.eq) || number === filter.eq) &&
        (isNil(filter.lt) || number < filter.lt) &&
        (isNil(filter.gt) || number > filter.gt)
      );
    }
  }
};

export const filterRows = <T>(
  rows: readonly T[],
  columns: TableColumnData[],
  filters: TableFilterValue,
) => {
  const active = columns.flatMap((column) => {
    const filter = filters[column.id];
    return filter ? [{ column, filter }] : [];
  });
  if (!active.length) return rows;
  return rows.filter((row) =>
    active.every(({ column, filter }) =>
      matchesFilter(getCellValue(column, row), filter),
    ),
  );
};

export const isFilterEmpty = (filter: TableColumnFilterValue) => {
  switch (filter.type) {
    case 'text':
      return !filter.contains;
    case 'enum':
      return !filter.in.length;
    case 'number':
      return isNil(filter.eq) && isNil(filter.lt) && isNil(filter.gt);
  }
};
