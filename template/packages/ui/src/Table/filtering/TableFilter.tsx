import { usePersistentCallback } from '@packages/utils/hooks';
import { useConfigSync, useValueSync } from '@packages/utils/state';

import { useGetTableStore } from '../store';

import type { TableFilterProps } from '../Table.types';

/** Config component: controlled with `value`, uncontrolled otherwise. */
export const TableFilter = ({
  value,
  defaultValue,
  onChange: _onChange,
}: TableFilterProps) => {
  const { store } = useGetTableStore();
  const onChange = usePersistentCallback(_onChange);

  useConfigSync('filterConfig', { controlled: value !== undefined, onChange });

  useValueSync(value, defaultValue, store('applyFilters'));

  return null;
};
