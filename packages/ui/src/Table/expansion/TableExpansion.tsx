import { usePersistentCallback } from '@packages/utils/hooks';
import {
  useConfigSync,
  useStoreSync,
  useValueSync,
} from '@packages/utils/state';
import { useLayoutEffect } from 'react';

import { useGetTableStore } from '../store';

import type { ExpansionConfig, ExpansionRender } from './expansionSlice';
import type { TableExpansionProps } from '../Table.types';

/** Config component: adds the expansion column; controlled with `value`. */
export function TableExpansion<T>({
  value,
  defaultValue,
  onChange: _onChange,
  isRowExpandable,
  isRowDisabled,
  children,
}: TableExpansionProps<T>) {
  const { store } = useGetTableStore();
  const onChange = usePersistentCallback(_onChange);

  useConfigSync('expansionConfig', {
    controlled: value !== undefined,
    onChange,
    isRowExpandable,
    isRowDisabled,
  } as ExpansionConfig);

  // Separate, so a new renderer only re-renders the expanded rows.
  useStoreSync(
    () => store('setExpansionRender')(children as ExpansionRender),
    [children],
  );

  useLayoutEffect(() => () => store('setExpansionRender')(undefined), [store]);

  useValueSync(value, defaultValue, store('applyExpansion'));

  return null;
}
