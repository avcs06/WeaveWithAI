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

  const tooltipEntries = [
    tooltip,
    truncated && children,
    isDisabled && disabledWithReason,
  ];

  return (
    <Tooltip tooltip={tooltipEntries}>
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
        <span id={labelId} ref={labelRef} className={labelClassName}>
          {children}
        </span>
        {rightSlot}
        {closable && (
          <IconButton
            id={closeId}
            variant="base"
            look="ghost"
            size={size}
            disabled={isDisabled}
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
