import { classNames } from '@packages/styles/classNames';
import { GripVertical } from 'lucide-react';
import React, { type ComponentProps, type Ref, memo } from 'react';

import { IconButton } from '../../Button';
import * as Primitives from '../primitives';

import * as styles from './DragHandleCell.css';

import type { DraggableAttributes } from '@dnd-kit/core';

type HandleListeners = Pick<
  ComponentProps<'button'>,
  'onPointerDown' | 'onKeyDown'
>;

export type DragHandleCellProps = Omit<
  DraggableAttributes,
  'role' | 'tabIndex' | 'aria-disabled'
> &
  HandleListeners & {
    /** Names the row, to tell handles apart. */
    label: string;
    sortActive: boolean;
    dragDisabled: boolean;
    ref?: Ref<HTMLButtonElement>;
  };

/** Receives the sortable activator ref, attributes and (stable) listeners. */
export const DragHandleCell = memo(
  ({ label, sortActive, dragDisabled, ref, ...props }: DragHandleCellProps) => (
    <Primitives.Cell data-slot="drag-cell">
      <IconButton
        size="xs"
        ref={ref}
        variant="base"
        look="ghost"
        tooltip="Reorder"
        aria-label={`Reorder ${label}`}
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
);
