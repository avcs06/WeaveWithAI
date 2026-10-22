import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import React, { useId } from 'react';

import { Button, IconButton } from '../../Button';
import { Select } from '../../Select';

import * as styles from './TablePaginationBar.css';
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
  disabled: boolean;
  onClick: () => void;
};

const PageButton = ({
  action,
  content,
  disabled,
  onClick,
}: PageButtonProps) => {
  const { text, label, icon } = PAGE_ACTIONS[action];
  return content === 'icons' ? (
    <IconButton
      size="sm"
      variant="base"
      aria-label={label}
      tooltip={label}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
    </IconButton>
  ) : (
    <Button variant="base" size="sm" disabled={disabled} onClick={onClick}>
      {text}
    </Button>
  );
};

type PageNumberProps = {
  pageIndex: number;
  current: boolean;
  disabled: boolean;
  onClick: () => void;
};

const PageNumber = ({
  pageIndex,
  current,
  disabled,
  onClick,
}: PageNumberProps) => (
  <Button
    variant={current ? 'default' : 'base'}
    look={current ? undefined : 'ghost'}
    size="sm"
    aria-label={`Page ${pageIndex + 1}`}
    aria-current={current ? 'page' : undefined}
    disabled={disabled}
    onClick={current ? undefined : onClick}
  >
    <div className="text-center min-w-4">{pageIndex + 1}</div>
  </Button>
);

export type PageControlsProps = {
  /** Names the navigation landmark; unique per table. */
  label: string;
  size: 'full' | 'minimal';
  content: 'text' | 'icons';
  /** Clamped to the last page. */
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  pageSizeOptions: readonly number[];
  disabled: boolean;
  onPageIndexChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

/**
 * full:    [10 / page]  First  Previous  3 4 5 6 7  Next  Last
 * minimal: [10 / page]  Previous  5  Next
 */
export const PageControls = ({
  label,
  size,
  content,
  pageIndex,
  pageSize,
  pageCount,
  pageSizeOptions,
  disabled,
  onPageIndexChange,
  onPageSizeChange,
}: PageControlsProps) => {
  const pageSizeName = useId();
  const isFull = size === 'full';
  const isFirst = disabled || pageIndex <= 0;
  const isLast = disabled || pageIndex >= pageCount - 1;
  const pageIndexes = isFull
    ? getPageWindow(pageIndex, pageCount)
    : [pageIndex];

  return (
    // Wraps on narrow screens; the page buttons wrap as one group.
    <nav aria-label={label} className="flex-row-gap-2 flex-wrap items-center">
      <Select
        name={pageSizeName}
        aria-label="Rows per page"
        className={styles.pageSizeSelect}
        disabled={disabled}
        value={String(pageSize)}
        onChange={(value) => value && onPageSizeChange(Number(value))}
        options={pageSizeOptions.map((option) => ({
          key: option,
          type: 'option',
          label: `${option} / page`,
          value: String(option),
        }))}
      />
      <div className="flex-row-gap-2 flex-wrap items-center">
        {isFull && (
          <PageButton
            action="first"
            content={content}
            disabled={isFirst}
            onClick={() => onPageIndexChange(0)}
          />
        )}
        <PageButton
          action="previous"
          content={content}
          disabled={isFirst}
          onClick={() => onPageIndexChange(pageIndex - 1)}
        />
        {pageIndexes.map((index) => (
          <PageNumber
            key={index}
            pageIndex={index}
            current={index === pageIndex}
            disabled={disabled}
            onClick={() => onPageIndexChange(index)}
          />
        ))}
        <PageButton
          action="next"
          content={content}
          disabled={isLast}
          onClick={() => onPageIndexChange(pageIndex + 1)}
        />
        {isFull && (
          <PageButton
            action="last"
            content={content}
            disabled={isLast}
            onClick={() => onPageIndexChange(pageCount - 1)}
          />
        )}
      </div>
    </nav>
  );
};
