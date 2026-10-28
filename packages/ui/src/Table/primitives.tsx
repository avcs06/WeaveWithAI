'use client';

import { classNames } from '@packages/styles/classNames';
import React, { type ComponentProps } from 'react';

import * as styles from './Table.css';
import { alignClasses } from './utils';

import type { TableAlign, TableColumnWidth } from './Table.types';

export type RootProps = ComponentProps<'div'>;
/** Fills the container width and never grows past the container height. */
export const Root = ({ className, ...props }: RootProps) => (
  <div
    {...props}
    // Own stacking context: the body's z-index (over the header's edge) stays
    // below portalled popovers.
    className={classNames(
      styles.root,
      'flex-col-gap-0 w-full max-h-full min-h-0',
      'isolate',
      className,
    )}
  />
);

export type FrameProps = ComponentProps<'div'>;
/** Presents the header and body tables as one table to assistive tech. */
export const Frame = ({ className, ...props }: FrameProps) => (
  <div
    role="table"
    {...props}
    className={classNames('flex-col-gap-0 min-h-0 flex-initial', className)}
  />
);

export type HeaderViewportProps = ComponentProps<'div'>;
/** Clips the header table; its scrollLeft follows the body. */
export const HeaderViewport = ({
  className,
  ...props
}: HeaderViewportProps) => (
  <div
    {...props}
    // Clips the header's visually hidden text, which would widen the page.
    className={classNames(
      styles.headerViewport,
      'overflow-hidden shrink-0',
      'relative',
      className,
    )}
  />
);

export type TableProps = ComponentProps<'table'>;
export const Table = ({ className, ...props }: TableProps) => (
  <table
    role="presentation"
    {...props}
    className={classNames(styles.table, 'w-full', className)}
  />
);

export type ColumnGroupProps = ComponentProps<'colgroup'>;
export const ColumnGroup = (props: ColumnGroupProps) => <colgroup {...props} />;

export type ColumnProps = Omit<ComponentProps<'col'>, 'width'> & {
  width?: TableColumnWidth;
};
export const Column = ({ width, style, ...props }: ColumnProps) => (
  <col {...props} style={{ width, ...style }} />
);

// Explicit roles aren't redundant: `Table` is role="presentation", which drops
// the implicit roles of its sections, rows and cells.

export type HeaderProps = ComponentProps<'thead'>;
export const Header = (props: HeaderProps) => (
  // eslint-disable-next-line jsx-a11y/no-redundant-roles -- see above
  <thead role="rowgroup" {...props} />
);

export type BodyProps = ComponentProps<'tbody'>;
export const Body = ({ className, ...props }: BodyProps) => (
  // eslint-disable-next-line jsx-a11y/no-redundant-roles -- see above
  <tbody
    role="rowgroup"
    {...props}
    className={classNames(styles.body, className)}
  />
);

export type RowProps = ComponentProps<'tr'>;
export const Row = ({ className, ...props }: RowProps) => (
  <tr role="row" {...props} className={classNames(styles.row, className)} />
);

export type HeaderCellProps = ComponentProps<'th'>;
/** Content alignment is the content's own: header items fill the cell. */
export const HeaderCell = ({ className, ...props }: HeaderCellProps) => (
  <th
    scope="col"
    role="columnheader"
    {...props}
    className={classNames(styles.columnHeaderCell, 'align-middle', className)}
  />
);

export type CellProps = ComponentProps<'td'> & {
  align?: TableAlign;
  /** A cell of the column that names each row. */
  rowHeader?: boolean;
};
export const Cell = ({
  className,
  align = 'left',
  rowHeader = false,
  ...props
}: CellProps) => {
  const Element = rowHeader ? 'th' : 'td';
  const alignClassName = alignClasses[align];
  return (
    <Element
      scope={rowHeader ? 'row' : undefined}
      role={rowHeader ? 'rowheader' : 'cell'}
      {...props}
      className={classNames(
        styles.cell,
        alignClassName,
        'align-middle',
        className,
      )}
    />
  );
};
