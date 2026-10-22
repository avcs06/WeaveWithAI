'use client';

import { ChevronsUpDown } from 'lucide-react';
import React from 'react';

import { Button, type ButtonTarget } from '../Button';

import type { PopoverButtonProps } from './Popover.types';

export const PopoverButton = <C extends ButtonTarget = 'button'>(
  props: PopoverButtonProps<C>,
) => {
  const {
    variant = 'base',
    rightIcon = <ChevronsUpDown />,
    ...buttonProps
  } = props;

  return <Button {...buttonProps} variant={variant} rightIcon={rightIcon} />;
};
