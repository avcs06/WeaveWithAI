import type { TableSlice } from '../store.types';
import type { TableInfiniteScrollProps } from '../Table.types';

export type InfiniteScrollConfig = TableInfiniteScrollProps;

export type InfiniteScrollSlice = {
  /** Undefined without `Table.InfiniteScroll`; only used in server mode. */
  infiniteScrollConfig: InfiniteScrollConfig | undefined;
};

export const createInfiniteScrollSlice: TableSlice<
  InfiniteScrollSlice
> = () => ({
  infiniteScrollConfig: undefined,
});
