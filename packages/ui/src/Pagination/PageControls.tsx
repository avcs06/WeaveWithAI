import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import React, { useId } from 'react';

import { Button, IconButton } from '../Button';
import { Select, SelectOption } from '../Select';
import { type DisabledState } from '../utils';

import { pageSizeSelect } from './Pagination.css';
import { getPageWindow } from './utils';

const PAGE_ACTIONS = {
  first: { text: 'First', label: 'First page', icon: <ChevronsLeft /> },
  previous: { text: 'Previous', label: 'Previous page', icon: <ChevronLeft /> },
  next: { text: 'Next', label: 'Next page', icon: <ChevronRight /> },
  last: { text: 'Last', label: 'Last page', icon: <ChevronsRight /> },
};

type PageButtonProps = {
  action: keyof typeof PAGE_ACTIONS;
  content: 'text' | 'icons';
  state: DisabledState;
  onClick: () => void;
};

const PageButton = ({ action, content, state, onClick }: PageButtonProps) => {
  const { text, label, icon } = PAGE_ACTIONS[action];
  return content === 'icons' ? (
    <IconButton
      size="sm"
      variant="base"
      tooltip={label}
      {...state}
      onClick={onClick}
    >
      {icon}
    </IconButton>
  ) : (
    <Button variant="base" size="sm" {...state} onClick={onClick}>
      {text}
    </Button>
  );
};

type PageNumberProps = {
  pageIndex: number;
  current: boolean;
  state: DisabledState;
  onClick: () => void;
};

const PageNumber = ({
  pageIndex,
  current,
  state,
  onClick,
}: PageNumberProps) => (
  <Button
    variant={current ? 'default' : 'base'}
    look={current ? undefined : 'ghost'}
    size="sm"
    aria-label={`Page ${pageIndex + 1}`}
    aria-current={current ? 'page' : undefined}
    {...state}
    onClick={current ? undefined : onClick}
  >
    <div className="text-center min-w-4">{pageIndex + 1}</div>
  </Button>
);

type PageControlsProps = {
  /** Names the navigation landmark; unique on the page. */
  label: string;
  /** Names the page-size select: "Rows per page". */
  pageSizeLabel: string;
  size: 'full' | 'minimal';
  content: 'text' | 'icons';
  /** Clamped to the last page. */
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  pageSizeOptions: readonly number[];
  state: DisabledState;
  onPageIndexChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

/**
 * full:    [10 / page]  First  Previous  3 4 5 6 7  Next  Last
 * minimal: [10 / page]  Previous  5  Next
 */
export const PageControls = ({
  label,
  pageSizeLabel,
  size,
  content,
  pageIndex,
  pageSize,
  pageCount,
  pageSizeOptions,
  state,
  onPageIndexChange,
  onPageSizeChange,
}: PageControlsProps) => {
  const pageSizeName = useId();
  const isFull = size === 'full';

  // With a reason, every control is disabled and says why; otherwise the
  // first and last pages disable only their own buttons.
  const blockedAt = (atBound: boolean): DisabledState =>
    state.disabledWithReason
      ? state
      : { disabled: Boolean(state.disabled) || atBound };
  const always = blockedAt(false);
  const atFirst = blockedAt(pageIndex <= 0);
  const atLast = blockedAt(pageIndex >= pageCount - 1);
  const pageIndexes = isFull
    ? getPageWindow(pageIndex, pageCount)
    : [pageIndex];

  return (
    // Wraps on narrow screens; the page buttons wrap as one group.
    <nav
      aria-label={label}
      data-slot="pagination-nav"
      className="flex-row-gap-2 flex-wrap items-center"
    >
      <Select
        name={pageSizeName}
        aria-label={pageSizeLabel}
        className={pageSizeSelect}
        {...always}
        allowSearch={false}
        allowClear={false}
        value={String(pageSize)}
        onChange={(value) => value && onPageSizeChange(Number(value))}
      >
        {pageSizeOptions.map((option) => (
          <SelectOption
            key={option}
            value={String(option)}
            label={`${option} / page`}
          />
        ))}
      </Select>
      <div className="flex-row-gap-2 flex-wrap items-center">
        {isFull && (
          <PageButton
            action="first"
            content={content}
            state={atFirst}
            onClick={() => onPageIndexChange(0)}
          />
        )}
        <PageButton
          action="previous"
          content={content}
          state={atFirst}
          onClick={() => onPageIndexChange(pageIndex - 1)}
        />
        {pageIndexes.map((index) => (
          <PageNumber
            key={index}
            pageIndex={index}
            current={index === pageIndex}
            state={always}
            onClick={() => onPageIndexChange(index)}
          />
        ))}
        <PageButton
          action="next"
          content={content}
          state={atLast}
          onClick={() => onPageIndexChange(pageIndex + 1)}
        />
        {isFull && (
          <PageButton
            action="last"
            content={content}
            state={atLast}
            onClick={() => onPageIndexChange(pageCount - 1)}
          />
        )}
      </div>
    </nav>
  );
};
