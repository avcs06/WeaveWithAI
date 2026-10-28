import { usePersistentCallback } from '@packages/utils/hooks';
import { useConfigSync, useValueSync } from '@packages/utils/state';

import { useGetTableStore } from '../store';

import type { SelectionConfig } from './selectionSlice';
import type { TableSelectionProps } from '../Table.types';

/** Config component: adds the selection column; controlled with `value`. */
export function TableSelection<T>({
  value,
  defaultValue,
  onChange: _onChange,
  isRowSelectable,
  isRowDisabled,
}: TableSelectionProps<T>) {
  const { store } = useGetTableStore();
  const onChange = usePersistentCallback(_onChange);

  useConfigSync('selectionConfig', {
    controlled: value !== undefined,
    onChange,
    isRowSelectable,
    isRowDisabled,
  } as SelectionConfig);

  useValueSync(value, defaultValue, store('applySelection'));

  return null;
}
