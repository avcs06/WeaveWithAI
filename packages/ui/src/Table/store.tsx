import {
  ConfigOrderProvider,
  ConfigSyncProvider,
  createStore,
  createStoreContext,
} from '@packages/utils/state';
import React, { type ReactNode } from 'react';

import { createColumnsSlice } from './columns/columnsSlice';
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

type TableProviderProps = {
  /** The config components, like Table.Column. */
  children: ReactNode;
  /** Renders from the store, after the config components. */
  content: ReactNode;
};

/** One store per table, created on mount; config components write into it. */
export const TableProvider = ({ children, content }: TableProviderProps) => (
  <TableStoreProvider>
    <TableConfigSync content={content}>{children}</TableConfigSync>
  </TableStoreProvider>
);

// Inside the store's provider to read it. Column order is render order,
// collected on every render.
const TableConfigSync = ({ children, content }: TableProviderProps) => {
  const { useStore, store } = useGetTableStore();
  return (
    <ConfigSyncProvider useStore={useStore}>
      <ConfigOrderProvider onOrder={store('setColumnOrder')}>
        {children}
      </ConfigOrderProvider>
      {content}
    </ConfigSyncProvider>
  );
};
