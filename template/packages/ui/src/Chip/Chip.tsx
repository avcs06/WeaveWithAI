'use client';

import { classNames } from '@packages/styles/classNames';
import React from 'react';

// eslint-disable-next-line import-rules/barrel-only-sibling-imports -- Button without its look, for controls that bring their own.
import { ButtonBase } from '../Button/Button';
import {
  Selectable,
  SelectableGroup,
  useSelectableItemState,
  useSelectableVariant,
} from '../Selectable';
import { createLook, useIsDisabled } from '../utils';

import { chipGroupRecipe, chipRecipe } from './Chip.recipes.css';

import type { ChipGroupProps, ChipProps } from './Chip.types';

const chipLook = createLook(chipRecipe);
const chipGroupLook = createLook(chipGroupRecipe);

/**
 * A compact toggle showing whether it's on: a standalone filter (`active`,
 * "Starred only") or one choice of a ChipGroup. Read as a checkbox, or a radio
 * in a single-choice group. A removable chosen value is a Tag; an action is a
 * Button.
 *
 * @invalidAlternative button[aria-pressed], Button[aria-pressed], Tag[onClick], .chip
 */
export const Chip = ({
  variant,
  size,
  look,
  value,
  active,
  onActiveChange,
  disabled,
  disabledWithReason,
  readOnly,
  readOnlyWithReason,
  className,
  ref,
  ...props
}: ChipProps) => {
  const { selection, ...lookVariants } = chipLook(look);
  const selectableVariant = useSelectableVariant(selection);
  const itemState = useSelectableItemState({
    disabled,
    disabledWithReason,
    readOnly,
    readOnlyWithReason,
  });
  const { isFocusable } = useIsDisabled({ ...props, ...itemState });

  const chipClassName = chipRecipe({
    variant,
    size,
    ...lookVariants,
    selection: selectableVariant,
  });

  const toggle = active === undefined ? {} : { active, onActiveChange };

  return (
    <Selectable
      value={value}
      {...toggle}
      // Radix `disabled` leaves the tab order and arrow keys: only with no
      // reason to show.
      disabled={!isFocusable}
    >
      <ButtonBase
        ref={ref}
        {...props}
        {...itemState}
        className={classNames(chipClassName, className)}
      />
    </Selectable>
  );
};

/**
 * Chips for 2 to about 8 short visible choices: one (`mode="single"`, default,
 * like radios) or any number (`mode="multiple"`, like checkboxes). Named by
 * `label`, `aria-label` or `aria-labelledby`. A form field with label, help
 * text and message; in a form, `{...field}` from Controller is all it needs.
 * Longer lists are a Select or MultiSelect.
 */
export const ChipGroup = ({ look, className, ...props }: ChipGroupProps) => {
  const { collapsed } = chipGroupLook(look);
  const groupClassName = chipGroupRecipe({ collapsed });

  return (
    <SelectableGroup
      {...props}
      // Collapsed, the bar is the layout; otherwise the caller lays it out.
      className={classNames(
        groupClassName,
        collapsed ? 'inline-flex-row-gap-0' : undefined,
        className,
      )}
    />
  );
};
