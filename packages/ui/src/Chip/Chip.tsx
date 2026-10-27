'use client';

import { classNames } from '@packages/styles/classNames';
import React, { forwardRef } from 'react';

// eslint-disable-next-line import-rules/barrel-only-sibling-imports -- Button without its look, for controls that bring their own.
import { ButtonBase } from '../Button/Button';
import {
  Selectable,
  SelectableGroup,
  useSelectableItemState,
  useSelectableVariant,
} from '../Selectable';
import { createLook, useIsDisabled } from '../utils';

import { chipRecipe } from './Chip.recipes.css';

import type { ChipGroupProps, ChipProps } from './Chip.types';

const chipLook = createLook(chipRecipe);

/**
 * A compact toggle that shows whether it's on: a filter on its own
 * (`active`, "Starred only"), or one choice of a ChipGroup. Read as a
 * checkbox, or a radio in a single-choice group. A chosen value the user
 * removes is a Tag; an action is a Button.
 *
 * @invalidAlternative button[aria-pressed], Button[aria-pressed], Tag[onClick], .chip
 */
export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  (
    {
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
      ...props
    },
    ref,
  ) => {
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
        // Radix's `disabled` takes a chip out of the arrow keys and the tab
        // order: only one with no reason to show leaves them.
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
  },
);
Chip.displayName = 'Chip';

/**
 * A set of Chips for 2 to about 8 short, always-visible choices: one
 * (`mode="single"`, the default, like radio buttons) or any number
 * (`mode="multiple"`, like checkboxes). Named by `label`, `aria-label` or
 * `aria-labelledby`. It's a form field, with its label, help text and
 * message; in a form, `{...field}` from Controller is all it needs. Longer
 * lists are a Select or MultiSelect.
 */
export const ChipGroup = (props: ChipGroupProps) => (
  <SelectableGroup {...props} />
);
