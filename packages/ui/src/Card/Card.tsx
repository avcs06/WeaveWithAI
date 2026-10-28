'use client';

import { classNames } from '@packages/styles/classNames';
import { preventDefault } from '@packages/utils/events';
import { Slot } from '@radix-ui/react-slot';
import React, { type ElementType } from 'react';

import { PlainButton } from '../Button';
import {
  Selectable,
  SelectableGroup,
  useSelectableGroup,
  useSelectableItemState,
  useSelectableVariant,
} from '../Selectable';
import { Tooltip } from '../Tooltip';
import { createLook, useIsDisabled } from '../utils';

import { cardRecipe } from './Card.recipes.css';

import type { CardGroupProps, CardProps, CardSurfaceProps } from './Card.types';

const cardLook = createLook(cardRecipe);

const CardSurface = ({
  asChild,
  disabled,
  reason,
  type: _type,
  value: _value,
  ...props
}: CardSurfaceProps) => {
  // Under asChild the ref is the child's, which a div's ref type rejects.
  const Comp = (asChild ? Slot : 'div') as ElementType;

  const state =
    disabled === undefined
      ? undefined
      : {
          'data-disabled': disabled || undefined,
          'aria-disabled': disabled || undefined,
          // A reason must be reachable by keyboard.
          tabIndex: disabled && !reason ? -1 : props.tabIndex,
          onClick: disabled ? preventDefault : props.onClick,
        };

  // Inside the element a Slot clones, which ignores the props of a tooltip.
  return (
    <Tooltip tooltip={reason}>
      <Comp {...props} {...state} />
    </Tooltip>
  );
};

/**
 * A bordered container with padding and gap, for one item's content or a large
 * option in a CardGroup. `onClick` makes the whole card one button; a card with
 * its own links or buttons stays static.
 *
 * @invalidAlternative article[onClick]
 */
export const Card = ({
  variant,
  look,
  value,
  active,
  onActiveChange,
  disabled,
  disabledWithReason,
  readOnly,
  readOnlyWithReason,
  onClick,
  className,
  ...props
}: CardProps) => {
  const { mode } = useSelectableGroup();
  const { selection, ...lookVariants } = cardLook(look);
  const selectableVariant = useSelectableVariant(selection);

  const { isDisabled, isFocusable, stateTooltip } = useIsDisabled(
    useSelectableItemState({
      disabled,
      disabledWithReason,
      readOnly,
      readOnlyWithReason,
    }),
  );

  const cardClassName = cardRecipe({
    variant,
    ...lookVariants,
    selection: selectableVariant,
  });

  const surfaceProps = {
    ...props,
    className: classNames(cardClassName, 'flex-col-gap-3', className),
  };

  if (mode || active !== undefined) {
    const toggle = active === undefined ? {} : { active, onActiveChange };

    return (
      <Selectable
        value={value}
        {...toggle}
        // Radix `disabled` leaves the tab order and arrow keys: only with no
        // reason to show.
        disabled={!isFocusable}
      >
        <CardSurface
          {...surfaceProps}
          onClick={onClick}
          disabled={isDisabled}
          reason={stateTooltip}
          data-clickable
        />
      </Selectable>
    );
  }

  if (onClick) {
    return (
      <PlainButton
        {...(stateTooltip
          ? { disabledWithReason: stateTooltip }
          : { disabled: isDisabled })}
        onClick={onClick}
      >
        <CardSurface {...surfaceProps} data-clickable />
      </PlainButton>
    );
  }

  return (
    <CardSurface
      {...surfaceProps}
      // Not a control: it only looks disabled, and the reason still shows on
      // hover.
      reason={stateTooltip || undefined}
      {...(isDisabled && { 'data-disabled': true })}
    />
  );
};

/**
 * Cards for a few large visible choices: one (`mode="single"`, default, like
 * radios) or any number (`mode="multiple"`, like checkboxes). A form field with
 * label, help text and message; in a form, `{...field}` from Controller is all
 * it needs.
 */
export const CardGroup = (props: CardGroupProps) => (
  <SelectableGroup {...props} />
);
