'use client';

import { classNames } from '@packages/styles/classNames';
import React from 'react';

import { PlainButton } from '../Button';
import { ControlChoice } from '../FormControl';
import {
  Selectable,
  SelectableGroup,
  useSelectableGroup,
  useSelectableItemState,
} from '../Selectable';
import { useIsDisabled } from '../utils';

import { radioRecipe } from './Radio.recipes.css';

import type { RadioGroupProps, RadioProps } from './Radio.types';

const assertInGroup = (mode: string | undefined) => {
  if (process.env.NODE_ENV === 'production') return;
  if (mode === 'single') return;
  throw new Error('Radio: render it inside a RadioGroup');
};

/**
 * One choice of a RadioGroup, with its label, its children, to its right.
 *
 * @invalidAlternative input[type="radio"], [role="radio"]
 */
export const Radio = ({
  value,
  children,
  hint,
  size,
  variant,
  tooltip,
  disabled,
  disabledWithReason,
  id,
  className,
  style,
  ...props
}: RadioProps) => {
  const { mode } = useSelectableGroup();
  assertInGroup(mode);

  // Its own state comes first, then its group's.
  const itemState = useSelectableItemState({ disabled, disabledWithReason });
  const { isDisabled, isReadOnly, isFocusable, stateTooltip } =
    useIsDisabled(itemState);
  const boxClassName = radioRecipe({ size, variant });

  return (
    <ControlChoice
      slot="radio"
      id={id}
      label={children}
      hint={hint}
      required={false}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      reason={stateTooltip}
      aria-labelledby={props['aria-labelledby']}
      aria-describedby={props['aria-describedby']}
      className={className}
      style={style}
    >
      {(boxProps) => (
        // PlainButton gives state, tooltip and reason; Radix, via Selectable,
        // the radio role with arrow keys and one tab stop. A read-only group
        // says so itself.
        <Selectable
          value={value}
          // Radix `disabled` leaves the tab order and arrow keys: only with no
          // reason to show.
          disabled={!isFocusable}
        >
          <PlainButton
            {...props}
            {...boxProps}
            {...itemState}
            tooltip={tooltip}
          >
            <span
              data-slot="box"
              className={classNames(
                boxClassName,
                'grid place-items-center shrink-0 cursor-pointer',
              )}
            >
              <span data-slot="dot" />
            </span>
          </PlainButton>
        </Selectable>
      )}
    </ControlChoice>
  );
};

/**
 * Radios for one choice from a few visible ones, like a ticket type. A form
 * field with label, help text and error; no layout: lay out with `className`.
 *
 * @invalidAlternative [role="radiogroup"]
 * @invalidAlternative import('@radix-ui/react-radio-group')
 */
export const RadioGroup = (props: RadioGroupProps) => (
  <SelectableGroup {...props} mode="single" />
);
