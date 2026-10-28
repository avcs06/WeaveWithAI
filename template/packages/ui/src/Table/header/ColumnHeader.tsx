import { classNames } from '@packages/styles/classNames';
import React, { memo, useId } from 'react';

import { Truncate } from '../../Truncate';
import { ColumnFilter } from '../filtering';
import * as Primitives from '../primitives';
import { SortButton, toAriaSort } from '../sorting';
import { useGetTableStore, useTableStore } from '../store';
import { alignClasses, getColumnLabel } from '../utils';

import * as styles from './ColumnHeader.css';

export const ColumnHeader = memo(({ columnId }: { columnId: string }) => {
  const { store } = useGetTableStore();
  const titleId = useId();

  const column = useTableStore((state) => state.columns[columnId]);

  const sortDirection = useTableStore((state) =>
    state.sort?.columnId === columnId ? state.sort.direction : undefined,
  );

  const filterValue = useTableStore((state) => state.filters[columnId]);

  if (!column) return null;

  const alignClassName = alignClasses[column.align ?? 'left'];
  const label = getColumnLabel(column);
  const title = <Truncate className={alignClassName}>{column.title}</Truncate>;

  return (
    // Named by the title alone; the filter button's label stays out of it.
    // Only the sorted column has `aria-sort`, as ARIA asks.
    <Primitives.HeaderCell
      data-slot="header-cell"
      aria-labelledby={titleId}
      aria-sort={sortDirection && toAriaSort(sortDirection)}
    >
      <div
        className={classNames(
          styles.headerContent,
          'flex-row-gap-0.5 items-center',
        )}
      >
        {column.sortable ? (
          <SortButton
            id={titleId}
            direction={sortDirection}
            className={classNames(styles.headerItem, 'flex-fill-x')}
            onClick={() => store('toggleSort')(columnId)}
          >
            {title}
          </SortButton>
        ) : (
          <div
            id={titleId}
            className={classNames(styles.headerItem, 'flex-fill-x py-1.5')}
          >
            {title}
          </div>
        )}

        {column.filter && (
          <ColumnFilter
            label={label}
            filter={column.filter}
            value={filterValue}
            onChange={(value) => store('setColumnFilter')(columnId, value)}
          />
        )}
      </div>
    </Primitives.HeaderCell>
  );
});
ColumnHeader.displayName = 'ColumnHeader';
