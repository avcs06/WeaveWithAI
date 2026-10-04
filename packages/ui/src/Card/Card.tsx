'use client';

import { classNames } from '@packages/styles/classNames';
import { preventDefault } from '@packages/utils/events';
import { Slot } from '@radix-ui/react-slot';
import React, { forwardRef } from 'react';

import {
  Selectable,
  SelectableGroup,
  type SelectableGroupProps,
  type SelectableProps,
  useSelectableGroup,
  useSelectableVariant,
} from '../Selectable';

import { cardRecipe } from './Card.recipes.css';

import type { RecipeVariants } from '@vanilla-extract/recipes';

type CardRecipeVariants = NonNullable<RecipeVariants<typeof cardRecipe>>;

type CardSurfaceProps = React.ComponentPropsWithoutRef<'div'> & {
  asChild?: boolean;
  disabled?: boolean;
  clickable?: boolean;
};

const CardSurface = forwardRef<HTMLDivElement, CardSurfaceProps>(
  ({ asChild, disabled, clickable, onClick, tabIndex, ...props }, ref) => {
    const Comp = asChild ? Slot : 'div';

    return (
      <Comp
        ref={ref}
        {...props}
        data-disabled={disabled}
        data-clickable={clickable || Boolean(onClick)}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : tabIndex}
        onClick={disabled ? preventDefault : onClick}
      />
    );
  },
);

export type CardProps = CardSurfaceProps &
  CardRecipeVariants &
  Pick<
    SelectableProps,
    'value' | 'active' | 'defaultActive' | 'onActiveChange'
  >;

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant,
      selection,
      elevated = false,
      value,
      active,
      defaultActive,
      onActiveChange,
      disabled,
      className,
      ...props
    },
    ref,
  ) => {
    const { disabled: groupDisabled } = useSelectableGroup();
    const isDisabled = disabled || groupDisabled;
    const selectableVariant = useSelectableVariant(selection);
    const cardClassName = cardRecipe({
      variant,
      selection: selectableVariant,
      elevated,
    });

    return (
      <Selectable
        value={value}
        active={active}
        defaultActive={defaultActive}
        onActiveChange={onActiveChange}
        disabled={isDisabled}
      >
        <CardSurface
          ref={ref}
          {...props}
          disabled={isDisabled}
          className={classNames(cardClassName, 'flex-col-gap-3', className)}
        />
      </Selectable>
    );
  },
);
Card.displayName = 'Card';

export type CardGroupProps = SelectableGroupProps;

export const CardGroup = forwardRef<HTMLDivElement, CardGroupProps>(
  (props, ref) => <SelectableGroup ref={ref} {...props} />,
);
CardGroup.displayName = 'CardGroup';
