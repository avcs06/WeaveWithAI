'use client';

import { ChevronDown } from 'lucide-react';
import React from 'react';

import { Button, type ButtonTarget } from '../Button';

import type { DropdownButtonProps } from './Dropdown.types';

export const DropdownButton = <C extends ButtonTarget = 'button'>(
  props: DropdownButtonProps<C>,
) => {
  const {
    variant = 'base',
    rightIcon = <ChevronDown />,
    ...buttonProps
  } = props;

  return <Button {...buttonProps} variant={variant} rightIcon={rightIcon} />;
};
