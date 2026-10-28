'use client';

import { ChevronDown } from 'lucide-react';
import React from 'react';

import { Button, type ButtonTarget } from '../Button';
// eslint-disable-next-line import-rules/barrel-only-sibling-imports -- shared styles for the icon at the end of a trigger.
import { controlIcon } from '../Button/Button.recipes.css';

import { useDropdown } from './context';

import type { DropdownButtonProps } from './Dropdown.types';

export const DropdownButton = <C extends ButtonTarget = 'button'>(
  props: DropdownButtonProps<C>,
) => {
  const { size = 'sm', variant = 'base', rightIcon, ...buttonProps } = props;
  const { isLoading } = useDropdown();
  const iconClassName = controlIcon({ size });

  return (
    <Button
      {...buttonProps}
      size={size}
      variant={variant}
      rightIcon={rightIcon ?? <ChevronDown className={iconClassName} />}
      loading={isLoading}
      // The Dropdown decides whether loading disables, and passes that on
      // as `disabled`.
      disableWhileLoading={false}
    />
  );
};
