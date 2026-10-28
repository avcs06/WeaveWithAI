import React, { type ReactNode } from 'react';

import { count } from './Pagination.css';

import type { PaginationInfoProps } from './Pagination.types';

// Fixed locale: the default can differ between server and browser, and the
// surrounding text is English.
const numberFormat = new Intl.NumberFormat('en-US');

const Count = ({ value }: { value: number }) => (
  <strong className={count}>{numberFormat.format(value)}</strong>
);

const plural = (count: number, one: string, many: string) =>
  count === 1 ? one : many;

/**
 * Showing **x** to **y** of **z** matches|items, or without a `range`: Showing
 * **x** of **z** matches|items. Then: Filtered from **o** · **m** items
 * selected
 *
 * @internal
 */
export const PaginationInfo = ({
  range,
  shownCount = 0,
  totalItems,
  itemName: [one, many],
  filtered = false,
  unfilteredTotal,
  selectedCount,
}: PaginationInfoProps) => {
  const details: ReactNode[] = [];

  // Announces page and filter changes.
  details.push(
    <span key="showing" aria-live="polite">
      Showing{' '}
      {range ? (
        <>
          <Count value={range.from} /> to <Count value={range.to} />
        </>
      ) : (
        <Count value={shownCount} />
      )}{' '}
      of <Count value={totalItems} />{' '}
      {filtered
        ? plural(totalItems, 'match', 'matches')
        : plural(totalItems, one, many)}
    </span>,
  );

  if (filtered && unfilteredTotal !== undefined)
    details.push(
      <span key="filtered">
        Filtered from <Count value={unfilteredTotal} />
      </span>,
    );

  if (selectedCount !== undefined && selectedCount > 0)
    details.push(
      <span key="selected">
        <Count value={selectedCount} /> {plural(selectedCount, one, many)}{' '}
        selected
      </span>,
    );

  return (
    <div data-slot="pagination-info" className="flex-col-gap-0.5">
      {details.length > 0 && (
        <span>
          {details.flatMap((detail, index) =>
            index === 0 ? [detail] : [' · ', detail],
          )}
        </span>
      )}
    </div>
  );
};
