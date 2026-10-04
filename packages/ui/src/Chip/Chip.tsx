'use client';

import { classNames } from '@packages/styles/classNames';
import React, { forwardRef } from 'react';

import { Button, type ButtonProps } from '../Button';
import {
  Selectable,
  SelectableGroup,
  type SelectableGroupProps,
  type SelectableProps,
  useSelectableGroup,
  useSelectableVariant,
} from '../Selectable';
import { useIsDisabled } from '../utils';

import { chipRecipe } from './Chip.recipes.css';

import type { RecipeVariants } from '@vanilla-extract/recipes';

type ChipRecipeVariants = NonNullable<RecipeVariants<typeof chipRecipe>>;

export type ChipProps = Omit<
  ButtonProps,
  'variant' | 'size' | 'radius' | 'isPlain' | 'overrideTokens' | 'value'
> &
  Omit<ChipRecipeVariants, 'disabled'> &
  Pick<
    SelectableProps,
    'value' | 'active' | 'defaultActive' | 'onActiveChange'
  >;

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  (
    {
      variant,
      selection,
      size,
      radius,
      value,
      active,
      defaultActive = false,
      onActiveChange,
      className,
      ...props
    },
    ref,
  ) => {
    const { disabled: groupDisabled } = useSelectableGroup();
    const selectableVariant = useSelectableVariant(selection);

    const { isDisabled } = useIsDisabled({
      ...props,
      disabled: props.disabled || groupDisabled,
    });

    const chipClassName = chipRecipe({
      variant,
      selection: selectableVariant,
      size,
      radius,
      disabled: isDisabled,
    });

    return (
      <Selectable
        value={value}
        active={active}
        defaultActive={defaultActive}
        onActiveChange={onActiveChange}
        disabled={isDisabled}
      >
        <Button
          ref={ref}
          isPlain
          {...props}
          disabled={isDisabled}
          className={classNames(chipClassName, className)}
        />
      </Selectable>
    );
  },
);
Chip.displayName = 'Chip';

export type ChipGroupProps = SelectableGroupProps;

export const ChipGroup = forwardRef<HTMLDivElement, ChipGroupProps>(
  (props, ref) => <SelectableGroup ref={ref} {...props} />,
);
ChipGroup.displayName = 'ChipGroup';
