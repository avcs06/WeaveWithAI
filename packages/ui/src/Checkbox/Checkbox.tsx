'use client';

import { classNames } from '@packages/styles/classNames';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import React from 'react';

import { PlainButton } from '../Button';
import { ControlChoice } from '../FormControl';
import { CheckIcon, MinusIcon } from '../Icons';
import {
  Selectable,
  useSelectableGroup,
  useSelectableItemState,
} from '../Selectable';
import { useIsDisabled } from '../utils';

import { checkboxRecipe } from './Checkbox.recipes.css';

import type { CheckboxProps } from './Checkbox.types';

/**
 * A checkbox with its label, its children, to its right: one yes/no choice,
 * like consent or a setting, or one of several in a CheckboxGroup.
 *
 * @invalidAlternative input[type="checkbox"], [role="checkbox"]
 * @invalidAlternative import('@radix-ui/react-checkbox')
 */
export const Checkbox = ({
  checked,
  onCheckedChange,
  children,
  hint,
  required = false,
  size,
  variant,
  tooltip,
  disabled,
  disabledWithReason,
  readOnly,
  readOnlyWithReason,
  value,
  name,
  id,
  className,
  style,
  ...props
}: CheckboxProps) => {
  const { mode, values = [] } = useSelectableGroup();
  const isInGroup = mode === 'multiple';

  // Its own state comes first, then its group's.
  const itemState = useSelectableItemState({
    disabled,
    disabledWithReason,
    readOnly,
    readOnlyWithReason,
  });
  const { isDisabled, isReadOnly, isFocusable, stateTooltip } =
    useIsDisabled(itemState);

  const isChecked =
    isInGroup && value !== undefined ? values.includes(value) : checked;
  const Mark = isChecked === 'indeterminate' ? MinusIcon : CheckIcon;
  const boxClassName = checkboxRecipe({ size, variant });

  return (
    <ControlChoice
      slot="checkbox"
      id={id}
      label={children}
      hint={hint}
      required={required}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      reason={stateTooltip}
      aria-labelledby={props['aria-labelledby']}
      aria-describedby={props['aria-describedby']}
      className={className}
      style={style}
    >
      {(boxProps) => {
        // PlainButton makes the box pressable, with its state, tooltip and
        // reason; Radix makes it a checkbox: in a group, through Selectable.
        const box = (
          <PlainButton
            {...props}
            {...boxProps}
            {...itemState}
            tooltip={tooltip}
            aria-readonly={isReadOnly || undefined}
          >
            <span
              data-slot="box"
              className={classNames(
                boxClassName,
                'grid place-items-center shrink-0',
              )}
            >
              {isChecked && <Mark aria-hidden data-slot="icon" />}
            </span>
          </PlainButton>
        );

        return isInGroup ? (
          <Selectable
            value={value}
            // Radix's `disabled` takes a box out of the tab order: only
            // one with no reason to show leaves it.
            disabled={!isFocusable}
          >
            {box}
          </Selectable>
        ) : (
          <CheckboxPrimitive.Root
            asChild
            checked={checked}
            onCheckedChange={(next) => onCheckedChange?.(next === true)}
            // A disabled checkbox submits nothing, like a native one.
            name={isDisabled ? undefined : name}
            value={value}
            required={required}
          >
            {box}
          </CheckboxPrimitive.Root>
        );
      }}
    </ControlChoice>
  );
};
