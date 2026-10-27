'use client';

import { classNames } from '@packages/styles/classNames';
import React, { type ComponentPropsWithoutRef, forwardRef } from 'react';

import * as styles from './Table.css';
import { alignRecipe } from './Table.recipes.css';

import type { TableAlign, TableColumnWidth } from './Table.types';

export type RootProps = ComponentPropsWithoutRef<'div'>;
/** Fills the container width and never grows past the container height. */
export const Root = forwardRef<HTMLDivElement, RootProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      {...props}
      className={classNames(
        styles.root,
        'flex-col-gap-0 w-full max-h-full min-h-0',
        className,
      )}
    />
  ),
);
Root.displayName = 'Root';

export type FrameProps = ComponentPropsWithoutRef<'div'>;
/** Presents the header and body tables as one table to assistive tech. */
export const Frame = forwardRef<HTMLDivElement, FrameProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="table"
      {...props}
      className={classNames('flex-col-gap-0 min-h-0 flex-initial', className)}
    />
  ),
);
Frame.displayName = 'Frame';

export type HeaderViewportProps = ComponentPropsWithoutRef<'div'>;
/** Clips the header table; its scrollLeft follows the body. */
export const HeaderViewport = forwardRef<HTMLDivElement, HeaderViewportProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      {...props}
      className={classNames(
        styles.headerViewport,
        'overflow-hidden shrink-0',
        className,
      )}
    />
  ),
);
HeaderViewport.displayName = 'HeaderViewport';

export type TableProps = ComponentPropsWithoutRef<'table'>;
export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className, ...props }, ref) => (
    <table
      ref={ref}
      role="presentation"
      {...props}
      className={classNames(styles.table, className)}
    />
  ),
);
Table.displayName = 'Table';

export type ColumnGroupProps = ComponentPropsWithoutRef<'colgroup'>;
export const ColumnGroup = forwardRef<HTMLTableColElement, ColumnGroupProps>(
  (props, ref) => <colgroup ref={ref} {...props} />,
);
ColumnGroup.displayName = 'ColumnGroup';

export type ColumnProps = Omit<ComponentPropsWithoutRef<'col'>, 'width'> & {
  width?: TableColumnWidth;
};
export const Column = forwardRef<HTMLTableColElement, ColumnProps>(
  ({ width, style, ...props }, ref) => (
    <col ref={ref} {...props} style={{ width, ...style }} />
  ),
);
Column.displayName = 'Column';

// Explicit roles below are not redundant: `Table` is role="presentation",
// which drops the implicit roles of its sections, rows and cells.

export type HeaderProps = ComponentPropsWithoutRef<'thead'>;
export const Header = forwardRef<HTMLTableSectionElement, HeaderProps>(
  (props, ref) => (
    // eslint-disable-next-line jsx-a11y/no-redundant-roles -- see above
    <thead ref={ref} role="rowgroup" {...props} />
  ),
);
Header.displayName = 'Header';

export type BodyProps = ComponentPropsWithoutRef<'tbody'>;
export const Body = forwardRef<HTMLTableSectionElement, BodyProps>(
  ({ className, ...props }, ref) => (
    // eslint-disable-next-line jsx-a11y/no-redundant-roles -- see above
    <tbody
      ref={ref}
      role="rowgroup"
      {...props}
      className={classNames(styles.body, className)}
    />
  ),
);
Body.displayName = 'Body';

export type RowProps = ComponentPropsWithoutRef<'tr'>;
export const Row = forwardRef<HTMLTableRowElement, RowProps>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      role="row"
      {...props}
      className={classNames(styles.row, className)}
    />
  ),
);
Row.displayName = 'Row';

export type HeaderCellProps = ComponentPropsWithoutRef<'th'>;
/** Content alignment is the content's own: header items fill the cell. */
export const HeaderCell = forwardRef<HTMLTableCellElement, HeaderCellProps>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      scope="col"
      role="columnheader"
      {...props}
      className={classNames(styles.columnHeaderCell, className)}
    />
  ),
);
HeaderCell.displayName = 'HeaderCell';

export type CellProps = ComponentPropsWithoutRef<'td'> & {
  align?: TableAlign;
  /** A cell of the column that names each row. */
  rowHeader?: boolean;
};
export const Cell = forwardRef<HTMLTableCellElement, CellProps>(
  ({ className, align, rowHeader = false, ...props }, ref) => {
    const alignClassName = alignRecipe({ align });
    const Element = rowHeader ? 'th' : 'td';
    return (
      <Element
        ref={ref}
        scope={rowHeader ? 'row' : undefined}
        role={rowHeader ? 'rowheader' : 'cell'}
        {...props}
        className={classNames(styles.cell, alignClassName, className)}
      />
    );
  },
);
Cell.displayName = 'Cell';
