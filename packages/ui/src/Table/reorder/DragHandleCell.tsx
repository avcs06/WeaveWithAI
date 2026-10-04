import { classNames } from '@packages/styles/classNames';
import { GripVertical } from 'lucide-react';
import React, { forwardRef, memo } from 'react';

import { IconButton, type IconButtonProps } from '../../Button';
import * as Primitives from '../primitives';

import * as styles from './DragHandleCell.css';

export type DragHandleCellProps = Omit<IconButtonProps, 'children'> & {
  /** One-based position of the row, to tell handles apart. */
  position: number;
  /** A sort is active: every handle is off, with a reason. */
  sortActive: boolean;
  dragDisabled: boolean;
};

/** Receives the sortable activator ref, attributes and (stable) listeners. */
export const DragHandleCell = memo(
  forwardRef<HTMLButtonElement, DragHandleCellProps>(
    ({ position, sortActive, dragDisabled, ...props }, ref) => (
      <Primitives.Cell>
        <IconButton
          size="xs"
          ref={ref}
          variant="ghost"
          aria-label={`Reorder row ${position}`}
          disabled={sortActive || dragDisabled}
          disabledReason={
            sortActive ? 'Clear sorting to reorder rows' : undefined
          }
          {...props}
          className={classNames(styles.cellControl, styles.dragHandle)}
        >
          <GripVertical size={16} />
        </IconButton>
      </Primitives.Cell>
    ),
  ),
);
DragHandleCell.displayName = 'DragHandleCell';
