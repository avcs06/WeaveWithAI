import type { ColumnsSlice } from './columns/columnsSlice';
import type { ExpansionSlice } from './expansion/expansionSlice';
import type { FilterSlice } from './filtering/filterSlice';
import type { InfiniteScrollSlice } from './infiniteScroll/infiniteScrollSlice';
import type { PaginationSlice } from './pagination/paginationSlice';
import type { ReorderSlice } from './reorder/reorderSlice';
import type { SelectionSlice } from './selection/selectionSlice';
import type { SortSlice } from './sorting/sortSlice';
import type { StateCreator } from 'zustand';

export type ViewportSlice = {
  /** The body's scroll element; set by the body, read by actions. */
  bodyViewport: HTMLElement | null;
  setBodyViewport: (element: HTMLElement | null) => void;
  scrollToTop: () => void;
};

export type TableStoreState = ColumnsSlice &
  SortSlice &
  FilterSlice &
  PaginationSlice &
  InfiniteScrollSlice &
  SelectionSlice &
  ExpansionSlice &
  ReorderSlice &
  ViewportSlice;

export type TableSlice<S> = StateCreator<TableStoreState, [], [], S>;
