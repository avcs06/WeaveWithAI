'use client';

import { classNames } from '@packages/styles/classNames';
import React, { forwardRef } from 'react';

// eslint-disable-next-line import-rules/barrel-only-sibling-imports -- Button without its look, for controls that bring their own.
import { ButtonBase } from '../Button/Button';
import {
  Selectable,
  SelectableGroup,
  useSelectableGroup,
  useSelectableVariant,
} from '../Selectable';
import { createLook, useIsDisabled } from '../utils';

import { chipRecipe } from './Chip.recipes.css';

import type { ChipGroupProps, ChipProps } from './Chip.types';

const chipLook = createLook(chipRecipe);

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  (
    {
      variant,
      size,
      look,
      value,
      active,
      defaultActive = false,
      onActiveChange,
      disabled,
      disabledWithReason,
      className,
      ...props
    },
    ref,
  ) => {
    const { disabled: groupDisabled } = useSelectableGroup();
    const { selection, ...lookVariants } = chipLook(look);
    const selectableVariant = useSelectableVariant(selection);

    // A disabled group disables its chips; a chip's own reason still shows.
    const disabledState = disabledWithReason
      ? { disabledWithReason }
      : { disabled: disabled || groupDisabled };

    const { isDisabled } = useIsDisabled({ ...props, ...disabledState });

    const chipClassName = chipRecipe({
      variant,
      size,
      ...lookVariants,
      selection: selectableVariant,
    });

    return (
      <Selectable
        value={value}
        active={active}
        defaultActive={defaultActive}
        onActiveChange={onActiveChange}
        disabled={isDisabled}
      >
        <ButtonBase
          ref={ref}
          {...props}
          {...disabledState}
          className={classNames(chipClassName, className)}
        />
      </Selectable>
    );
  },
);
Chip.displayName = 'Chip';

export const ChipGroup = forwardRef<HTMLDivElement, ChipGroupProps>(
  (props, ref) => <SelectableGroup ref={ref} {...props} />,
);
ChipGroup.displayName = 'ChipGroup';
