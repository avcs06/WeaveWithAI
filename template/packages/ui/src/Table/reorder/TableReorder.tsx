import { usePersistentCallback } from '@packages/utils/hooks';
import { useConfigSync } from '@packages/utils/state';

import type { ReorderConfig } from './reorderSlice';
import type { TableReorderProps } from '../Table.types';

/** Config component: adds the drag handle column. */
export function TableReorder<T>({
  onReorder: _onReorder,
  isRowDisabled,
}: TableReorderProps<T>) {
  const onReorder = usePersistentCallback(_onReorder);

  useConfigSync('reorderConfig', { onReorder, isRowDisabled } as ReorderConfig);

  return null;
}
