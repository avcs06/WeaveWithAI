import { usePersistentCallback } from '@packages/utils/hooks';
import { useConfigSync, useValueSync } from '@packages/utils/state';

import { useGetTableStore } from '../store';

import type { TableSortProps } from '../Table.types';

/** Config component: controlled with `value`, uncontrolled otherwise. */
export const TableSort = ({
  value,
  defaultValue,
  onChange: _onChange,
}: TableSortProps) => {
  const { store } = useGetTableStore();
  const onChange = usePersistentCallback(_onChange);

  useConfigSync('sortConfig', { controlled: value !== undefined, onChange });

  useValueSync(value, defaultValue, store('applySort'));

  return null;
};
