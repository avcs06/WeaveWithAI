import { useConfigOrder, useStoreSync } from '@packages/utils/state';
import { useLayoutEffect } from 'react';

import { useGetTableStore } from '../store';

import type {
  NoComputed,
  TableColumnData,
  TableColumnProps,
  TableColumnRender,
} from '../Table.types';

// What every `TableColumnProps` variant can carry.
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
    rowHeader,
    children,
  } = props as unknown as AnyTableColumnProps;
  const { store } = useGetTableStore();
  useConfigOrder(id);

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
      rowHeader,
    });
  }, [id, title, dataKey, computed, sortable, width, align, filter, rowHeader]);

  // Separate, so a new renderer re-renders only this column's cells. No deps:
  // `children` changes every render, so it writes every render.
  useStoreSync(() => {
    store('setColumnRender')(id, children);
  });

  useLayoutEffect(() => () => store('removeColumn')(id), [store, id]);

  return null;
}
