'use client';

import { classNames } from '@packages/styles/classNames';
import { X } from 'lucide-react';
import React, { useId } from 'react';

import { IconButton } from '../Button';
import { Tooltip } from '../Tooltip';
import { useTruncation } from '../Truncate';
import { createLook, useIconAddon } from '../utils';

import { tagClose } from './Tag.css';
import { tagRecipe } from './Tag.recipes.css';

import type { TagProps } from './Tag.types';

const tagLook = createLook(tagRecipe);

/**
 * A short label that only informs: a status, a category, a count, or a
 * chosen filter the user removes with its close button (`closable`). A tag
 * is never clicked: a toggle is a Chip, an action a Button.
 *
 * @invalidAlternative .badge, .tag, .pill
 */
export const Tag = ({
  variant,
  size,
  look,
  leftIcon,
  rightIcon,
  leftAddOn,
  rightAddOn,
  closable = false,
  onClose,
  closeRef,
  closeTabIndex,
  tooltip,
  disabled = false,
  disabledWithReason,
  className,
  children,
  ...props
}: TagProps) => {
  const labelId = useId();
  const closeId = useId();

  const {
    ref: labelRef,
    className: labelClassName,
    truncated,
  } = useTruncation<HTMLSpanElement>(children);

  const { leftSlot, rightSlot } = useIconAddon({
    leftIcon,
    rightIcon,
    leftAddOn,
    rightAddOn,
  });

  const isDisabled = disabled || Boolean(disabledWithReason);
  const tagClassName = tagRecipe({ variant, size, ...tagLook(look) });

  const reason = isDisabled && disabledWithReason;
  const hoverTooltip = [tooltip, truncated && children, reason];

  // Closable, the close button is the part that takes focus, so it carries
  // the tooltip and reason, and the label shows them on hover: a trigger
  // nested in another would fight it over the one tooltip.
  return (
    <Tooltip
      tooltip={closable ? null : hoverTooltip}
      description={[tooltip, reason]}
    >
      <span
        {...props}
        data-closable={closable || undefined}
        data-disabled={isDisabled || undefined}
        className={classNames(
          'inline-flex-row-gap-0 items-center',
          tagClassName,
          className,
        )}
      >
        {leftSlot}
        <Tooltip tooltip={closable ? hoverTooltip : null} description={null}>
          <span id={labelId} ref={labelRef} className={labelClassName}>
            {children}
          </span>
        </Tooltip>
        {rightSlot}
        {closable && (
          <IconButton
            ref={closeRef}
            id={closeId}
            data-slot="close"
            variant="base"
            look="ghost"
            size={size}
            {...(disabledWithReason ? { disabledWithReason } : { disabled })}
            tooltip="Remove"
            tabIndex={closeTabIndex}
            // Read as "Remove" followed by the label.
            aria-label="Remove"
            aria-labelledby={`${closeId} ${labelId}`}
            onClick={onClose}
            className={classNames(tagClose, 'shrink-0')}
          >
            <X />
          </IconButton>
        )}
      </span>
    </Tooltip>
  );
};
