import { classNames } from '@packages/styles/classNames';
import { GripVertical } from 'lucide-react';
import React, { type ComponentPropsWithoutRef, forwardRef, memo } from 'react';

import { IconButton } from '../../Button';
import * as Primitives from '../primitives';

import * as styles from './DragHandleCell.css';

import type { DraggableAttributes } from '@dnd-kit/core';

type HandleListeners = Pick<
  ComponentPropsWithoutRef<'button'>,
  'onPointerDown' | 'onKeyDown'
>;

export type DragHandleCellProps = DraggableAttributes &
  HandleListeners & {
    position: number;
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
          variant="base"
          look="ghost"
          aria-label={`Reorder row ${position}`}
          {...(sortActive
            ? { disabledWithReason: 'Clear sorting to reorder rows' }
            : { disabled: dragDisabled })}
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
