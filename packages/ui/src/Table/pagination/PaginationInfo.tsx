import React, { type ReactNode } from 'react';

import * as styles from './TablePaginationBar.css';

const Count = ({ value }: { value: number }) => (
  <strong className={styles.count}>{value.toLocaleString()}</strong>
);

const plural = (count: number, one: string, many: string) =>
  count === 1 ? one : many;

export type PaginationInfoProps = {
  /** First and last row of the page, one-based; 0 when empty. */
  range?: { from: number; to: number };
  /** Without a `range`: rows in the table (loaded, with infinite scroll). */
  shownCount: number;
  /** Rows matching the filters. */
  filteredCount: number;
  /** Rows before filtering; may be unknown in server mode. */
  totalCount?: number;
  filtered: boolean;
  /** Undefined when selection is off. */
  selectedCount?: number;
};

/**
 * Showing **x** to **y** of **z** matches|rows, or without a `range`:
 * Showing **x** of **z** matches|rows. Then: Filtered from **o** · **m** rows selected
 */
export const PaginationInfo = ({
  range,
  shownCount,
  filteredCount,
  totalCount,
  filtered,
  selectedCount,
}: PaginationInfoProps) => {
  const details: ReactNode[] = [];

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
      of <Count value={filteredCount} />{' '}
      {filtered
        ? plural(filteredCount, 'match', 'matches')
        : plural(filteredCount, 'row', 'rows')}
    </span>,
  );

  if (filtered && totalCount !== undefined)
    details.push(
      <span key="filtered">
        Filtered from <Count value={totalCount} />
      </span>,
    );

  if (selectedCount !== undefined && selectedCount > 0)
    details.push(
      <span key="selected">
        <Count value={selectedCount} /> {plural(selectedCount, 'row', 'rows')}{' '}
        selected
      </span>,
    );

  return (
    <div className="flex-col-gap-0.5">
      {/* Announces page and filter changes. */}
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
