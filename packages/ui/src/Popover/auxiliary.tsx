'use client';

import { ChevronsUpDown } from 'lucide-react';
import React from 'react';

import { Button, type ButtonTarget } from '../Button';
// eslint-disable-next-line import-rules/barrel-only-sibling-imports -- shared styles for the icon at the end of a trigger.
import { controlIcon } from '../Button/Button.recipes.css';

import { usePopover } from './context';

import type { PopoverButtonProps } from './Popover.types';

/**
 * A Popover's trigger: a base Button with an up-down chevron that shows the
 * Popover's disabled or loading state and reason in its own tooltip.
 */
export const PopoverButton = <C extends ButtonTarget = 'button'>(
  props: PopoverButtonProps<C>,
) => {
  const { size = 'sm', variant = 'base', rightIcon, ...buttonProps } = props;
  const state = usePopover();
  const iconClassName = controlIcon({ size });

  return (
    <Button
      {...buttonProps}
      {...state}
      size={size}
      variant={variant}
      rightIcon={rightIcon ?? <ChevronsUpDown className={iconClassName} />}
    />
  );
};
