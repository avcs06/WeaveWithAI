import {
  ConfigSyncProvider,
  createStore,
  createStoreContext,
  useConfigSyncContext,
} from '@packages/utils/state';
import React, { type ReactNode, useLayoutEffect, useReducer } from 'react';

import { createColumnsSlice } from './columns/columnsSlice';
import { ColumnOrderContext, createOrderPass } from './columns/orderPass';
import { createExpansionSlice } from './expansion/expansionSlice';
import { createFilterSlice } from './filtering/filterSlice';
import { createInfiniteScrollSlice } from './infiniteScroll/infiniteScrollSlice';
import { createPaginationSlice } from './pagination/paginationSlice';
import { createReorderSlice } from './reorder/reorderSlice';
import { createSelectionSlice } from './selection/selectionSlice';
import { createSortSlice } from './sorting/sortSlice';

import type { TableSlice, TableStoreState, ViewportSlice } from './store.types';

const createViewportSlice: TableSlice<ViewportSlice> = (set, get) => ({
  bodyViewport: null,
  setBodyViewport: (bodyViewport) => set({ bodyViewport }),
  scrollToTop: () => get().bodyViewport?.scrollTo({ top: 0 }),
});

const createTableStore = () =>
  createStore<TableStoreState>(
    (...args) => ({
      ...createColumnsSlice(...args),
      ...createSortSlice(...args),
      ...createFilterSlice(...args),
      ...createPaginationSlice(...args),
      ...createInfiniteScrollSlice(...args),
      ...createSelectionSlice(...args),
      ...createExpansionSlice(...args),
      ...createReorderSlice(...args),
      ...createViewportSlice(...args),
    }),
    { serverSnapshot: 'current' },
  );

const [_useTableStore, _useGetTableStore, TableStoreProvider] =
  createStoreContext(createTableStore);

export const useTableStore = _useTableStore;
export const useGetTableStore = _useGetTableStore;

/** One store per table, created on mount; config components write into it. */
export const TableProvider = ({ children }: { children: ReactNode }) => (
  <TableStoreProvider>
    <TableConfigSync>{children}</TableConfigSync>
  </TableStoreProvider>
);

// Inside the store's provider, so it can read the table's store.
const TableConfigSync = ({ children }: { children: ReactNode }) => {
  const { useStore } = useGetTableStore();
  return (
    <ConfigSyncProvider useStore={useStore}>
      <ColumnOrderProvider>{children}</ColumnOrderProvider>
    </ConfigSyncProvider>
  );
};

/**
 * Collects the column order, which is render order: every render hands the
 * columns a new pass, so every `Table.Column` re-renders with the table,
 * wherever it sits (wrapper components included), and adds its id in tree
 * order.
 */
const ColumnOrderProvider = ({ children }: { children: ReactNode }) => {
  'use no memo'; // A new order pass on every render is the point.
  const { store } = useGetTableStore();
  const { mounted } = useConfigSyncContext();

  const [, refreshOrder] = useReducer((count: number) => count + 1, 0);
  const orderPass = createOrderPass(refreshOrder, (ids) => {
    // While the table mounts, the content renders before any effect runs.
    if (!mounted) store('setColumnOrder')([...ids]);
  });

  // Runs after the columns' effects, and before `ConfigSyncProvider` marks
  // the table mounted, so the first commit skips the write: its order was
  // written while rendering.
  useLayoutEffect(() => {
    orderPass.close();
    if (mounted) store('setColumnOrder')(orderPass.ids);
  }, [orderPass, store, mounted]);

  return (
    <ColumnOrderContext.Provider value={orderPass}>
      {children}
    </ColumnOrderContext.Provider>
  );
};
