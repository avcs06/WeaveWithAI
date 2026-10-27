import type { MouseEvent, ReactNode } from 'react';

/** `client` sorts, filters and pages in the table; `server` only emits changes. */
export type TableMode = 'client' | 'server';

export type TableRowKey = string | number;

export type TableAlign = 'left' | 'center' | 'right';

/** Numbers are pixels. Columns without a width share the remaining space. */
export type TableColumnWidth = number | `${number}px` | `${number}%`;

/**
 * Every config part is controlled when `value` is passed, uncontrolled
 * otherwise. `E` is what `onChange` emits, when looser than the input.
 */
export type TableControlledProps<V, E = V> = {
  value?: V;
  defaultValue?: V;
  onChange?: (value: E) => void;
};

/** Accepts any key array; emits a new one, safe to keep in state. */
type TableRowKeysProps = TableControlledProps<
  readonly TableRowKey[],
  TableRowKey[]
>;

export type TableSortDirection = 'asc' | 'desc';

export type TableSortValue = {
  columnId: string;
  direction: TableSortDirection;
} | null;

export type TableSortProps = TableControlledProps<TableSortValue>;

export type TableFilterOption = {
  label: string;
  value: string;
};

export type TableColumnFilter =
  | { type: 'text' }
  | { type: 'enum'; options: readonly TableFilterOption[] }
  | { type: 'number' };

export type TableTextFilterValue = {
  type: 'text';
  contains: string;
};

export type TableEnumFilterValue = {
  type: 'enum';
  in: string[];
};

export type TableNumberFilterValue = {
  type: 'number';
  eq?: number;
  lt?: number;
  gt?: number;
};

export type TableColumnFilterValue =
  | TableTextFilterValue
  | TableEnumFilterValue
  | TableNumberFilterValue;

/** Active filters keyed by column id; inactive columns are absent. */
export type TableFilterValue = Record<string, TableColumnFilterValue>;

export type TableFilterProps = TableControlledProps<TableFilterValue>;

export type TableSelectionProps<T> = TableRowKeysProps & {
  /** `false` leaves the cell empty, unless the row is already selected. */
  isRowSelectable?: (row: T) => boolean;
  /** `true` shows a disabled checkbox; select-all leaves the row as is. */
  isRowDisabled?: (row: T) => boolean;
};

export type TableExpansionProps<T> = TableRowKeysProps & {
  children: (row: T) => ReactNode;
  /** `false` leaves the cell empty, unless the row is already expanded. */
  isRowExpandable?: (row: T) => boolean;
  /** `true` shows a disabled expand button. */
  isRowDisabled?: (row: T) => boolean;
};

/** Zero-based page index. */
export type TablePaginationValue = {
  pageIndex: number;
  pageSize: number;
};

/**
 * Use either `Table.Pagination` or `Table.InfiniteScroll`, not both. Server
 * mode needs `totalItems`, or there is only one page.
 */
export type TablePaginationProps =
  TableControlledProps<TablePaginationValue> & {
    size?: 'full' | 'minimal';
    content?: 'text' | 'icons';
    pageSizeOptions?: readonly number[];
    /** Server mode: rows matching the current filters. */
    totalItems?: number;
    /** Server mode: rows before filtering, shown in the filtered stat. */
    unfilteredTotalItems?: number;
  };

/**
 * Server mode only; ignored with a warning in client mode, where `virtualized`
 * handles large data. Use either `Table.Pagination` or this, not both. Keep
 * `data` the same array until rows are added: it loads once per array.
 */
export type TableInfiniteScrollProps = {
  /** Rows matching the current filters; loading stops once `data` has them all. */
  totalItems: number;
  /** Called when the body nears its end, and by the footer's load more button. */
  onLoadMore: () => void;
};

type TableColumnBaseProps = {
  id: string;
  title: ReactNode;
  sortable?: boolean;
  width?: TableColumnWidth;
  align?: TableAlign;
  /**
   * The column that names each row, like an attendee's name: its cells are
   * row headers, which screen readers read with every cell of the row, and
   * its value names the row's controls ("Select Ada Lovelace"). One per
   * table; without one, the first column with a value names the controls.
   */
  rowHeader?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare const noComputed: unique symbol;
/** Default for `TableColumnProps`' `C`: the column has no `computed`. */
export type NoComputed = typeof noComputed;

/**
 * Text and enum filters read any value as text; a number filter needs a
 * number. An untyped column's `unknown` value takes any.
 */
type TableColumnFilterFor<V> = [V] extends [number | null | undefined]
  ? TableColumnFilter
  : unknown extends V
    ? TableColumnFilter
    : Exclude<TableColumnFilter, { type: 'number' }>;

/**
 * `computed(value, row)` gets the `dataKey` value (`undefined` without one) and
 * the row, like `children`; its result replaces the value for client sort,
 * client filter and render. Pass its result type as `C` to use it.
 *
 * It is compared by reference: an inline function is new on every render, so
 * without the React Compiler the table re-sorts and re-filters every time.
 * Define it outside the component or memoize it.
 */
type TableColumnValueProps<T, V, C> = [C] extends [NoComputed]
  ? {
      computed?: undefined;
      filter?: TableColumnFilterFor<V>;
      children?: (value: V, row: T) => ReactNode;
    }
  : {
      computed: (value: V, row: T) => C;
      filter?: TableColumnFilterFor<C>;
      children?: (value: C, row: T) => ReactNode;
    };

type TableDataKeyColumn<T, C> = {
  [K in keyof T & string]: {
    dataKey: K;
  } & TableColumnValueProps<T, T[K], C>;
}[keyof T & string];

/**
 * Without `dataKey` or `computed` there is no value: `children` is required,
 * and there is nothing to sort or filter by.
 */
type TableStaticColumnProps<T> = {
  computed?: undefined;
  children: (value: undefined, row: T) => ReactNode;
  sortable?: never;
  filter?: never;
};

type TableKeylessColumn<T, C> = {
  dataKey?: undefined;
} & ([C] extends [NoComputed]
  ? TableStaticColumnProps<T>
  : TableColumnValueProps<T, undefined, C>);

export type TableColumnProps<
  T extends object = Record<string, unknown>,
  C = NoComputed,
> = TableColumnBaseProps &
  (TableDataKeyColumn<T, C> | TableKeylessColumn<T, C>);

/** Column props as stored; the renderer is stored separately. */
export type TableColumnData = TableColumnBaseProps & {
  dataKey?: string;
  computed?: (value: unknown, row: unknown) => unknown;
  filter?: TableColumnFilter;
};

export type TableColumnRender = (value: unknown, row: unknown) => ReactNode;

export type TableRowReorderEvent<T> = {
  rowKey: TableRowKey;
  fromIndex: number;
  toIndex: number;
  /** `data` with the row moved; the table never mutates `data` itself. */
  rows: T[];
};

/** Adds a drag handle column; reordering is off while a sort is active. */
export type TableReorderProps<T> = {
  onReorder: (event: TableRowReorderEvent<T>) => void;
  /** `true` disables the row's drag handle; other rows still move past it. */
  isRowDisabled?: (row: T) => boolean;
};

export type TableProps<T> = {
  data: readonly T[];
  /** A row's identity: the same key for the same row on every render. */
  rowKey: (row: T) => TableRowKey;
  /** Accessible name of the table. */
  caption: string;
  mode?: TableMode;
  /** Renders only visible rows; give the container a fixed height. */
  virtualized?: boolean;
  loading?: boolean;
  emptyMessage?: ReactNode;
  /**
   * A click on a row, outside its controls: a pointer shortcut for the row's
   * main action. Keyboard and screen-reader users can't click a row, so that
   * action must also be a link or button in the row, such as a `Link` in its
   * name cell. Ignored with `Table.Expansion`: a row click expands or
   * collapses the row instead.
   */
  onRowClick?: (row: T, event: MouseEvent<HTMLTableRowElement>) => void;
  className?: string;
  children?: ReactNode;
};

/** `Table` with its row type bound to every part; see `createTable`. */
export type TypedTable<T extends object> = {
  (props: TableProps<T>): ReactNode;
  Column: <C = NoComputed>(props: TableColumnProps<T, C>) => ReactNode;
  Selection: (props: TableSelectionProps<T>) => ReactNode;
  Expansion: (props: TableExpansionProps<T>) => ReactNode;
  Reorder: (props: TableReorderProps<T>) => ReactNode;
  Sort: (props: TableSortProps) => ReactNode;
  Filter: (props: TableFilterProps) => ReactNode;
  Pagination: (props: TablePaginationProps) => ReactNode;
  InfiniteScroll: (props: TableInfiniteScrollProps) => ReactNode;
};
