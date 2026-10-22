'use client';

import { classNames } from '@packages/styles/classNames';
import { preventDefault } from '@packages/utils/events';
import { Slot } from '@radix-ui/react-slot';
import React, { forwardRef } from 'react';

import {
  Selectable,
  SelectableGroup,
  useSelectableGroup,
  useSelectableVariant,
} from '../Selectable';
import { createLook } from '../utils';

import { cardRecipe } from './Card.recipes.css';

import type { CardGroupProps, CardProps, CardSurfaceProps } from './Card.types';

const cardLook = createLook(cardRecipe);

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

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant,
      look,
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
    const { selection, ...lookVariants } = cardLook(look);
    const selectableVariant = useSelectableVariant(selection);
    const cardClassName = cardRecipe({
      variant,
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

export const CardGroup = forwardRef<HTMLDivElement, CardGroupProps>(
  (props, ref) => <SelectableGroup ref={ref} {...props} />,
);
CardGroup.displayName = 'CardGroup';
