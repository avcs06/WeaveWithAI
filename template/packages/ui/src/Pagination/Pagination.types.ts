import type { DisabledState } from '../utils';

export type PaginationValue = {
  pageIndex: number;
  pageSize: number;
};

export type PaginationLayout = {
  /**
   * `full` (default): First, Previous, up to five page numbers, Next, Last.
   * `minimal`: Previous, the current page, Next.
   */
  size?: 'full' | 'minimal';
  /** First, Previous, Next and Last as words (default) or icons. */
  content?: 'text' | 'icons';
  /** Page sizes to pick from; the first is the default. */
  pageSizeOptions?: readonly number[];
};

export type PaginationInfoProps = {
  /** First and last item of the page, one-based; 0 when empty. */
  range?: { from: number; to: number };
  /** Without a `range`: the items shown, like the rows loaded so far. */
  shownCount?: number;
  totalItems: number;
  itemName: readonly [string, string];
  filtered?: boolean;
  unfilteredTotal?: number;
  selectedCount?: number;
};

/**
 * `disabled` holds the controls, like while a page loads; `disabledWithReason`
 * also says why, in each control's tooltip.
 */
export type PaginationProps = PaginationLayout &
  DisabledState & {
    /** Names the page navigation, unique on the page: "Sessions pagination". */
    label: string;
    /** Items across every page; the page count comes from it. */
    totalItems: number;
    /** Controlled: pass with `onChange`. A new page size starts at page one. */
    value?: PaginationValue;
    defaultValue?: PaginationValue;
    onChange?: (value: PaginationValue) => void;
    /** "Showing 11 to 20 of 95 items" beside the controls (default). */
    showInfo?: boolean;
    /** The items' name, one and many: `['session', 'sessions']`. */
    itemName?: readonly [string, string];
    /** The items are filtered: counted as matches. */
    filtered?: boolean;
    /** Items before filtering: "Filtered from 120". */
    unfilteredTotal?: number;
    /** Items chosen across pages: "3 sessions selected". */
    selectedCount?: number;
    className?: string;
  };
