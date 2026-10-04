import { useStoreSync } from '@packages/utils/state';
import { useLayoutEffect } from 'react';

import { useGetTableStore } from '../store';

import { useColumnOrder } from './useColumnOrder';

import type {
  NoComputed,
  TableColumnData,
  TableColumnProps,
  TableColumnRender,
} from '../Table.types';

// What every variant of `TableColumnProps` can carry, for reading the props.
type AnyTableColumnProps = TableColumnData & { children?: TableColumnRender };

/** Config component: registers its props and renderer; renders nothing. */
export function TableColumn<
  T extends object = Record<string, unknown>,
  C = NoComputed,
>(props: TableColumnProps<T, C>) {
  const {
    id,
    title,
    dataKey,
    computed,
    sortable,
    width,
    align,
    filter,
    children,
  } = props as unknown as AnyTableColumnProps;
  const { store } = useGetTableStore();
  useColumnOrder(id);

  useStoreSync(() => {
    store('setColumn')({
      id,
      title,
      dataKey,
      computed,
      sortable,
      width,
      align,
      filter,
    });
  }, [id, title, dataKey, computed, sortable, width, align, filter]);

  // Separate, so a new renderer only re-renders this column's cells.
  useStoreSync(() => {
    store('setColumnRender')(id, children);
  }, [id, children]);

  useLayoutEffect(() => () => store('removeColumn')(id), [store, id]);

  return null;
}
