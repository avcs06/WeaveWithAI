'use client';

import { classNames } from '@packages/styles/classNames';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import React from 'react';

import { PlainButton } from '../Button';
import { ControlChoice } from '../FormControl';
import { useIsDisabled } from '../utils';

import { switchRecipe } from './Switch.recipes.css';

import type { SwitchProps } from './Switch.types';

/**
 * A switch with its label, its children, to its right: a setting that takes
 * effect as soon as it's flipped, like notifications or a public profile. A
 * choice confirmed later, with a form's submit, is a Checkbox.
 *
 * @invalidAlternative [role="switch"], input[type="checkbox"][role="switch"]
 * @invalidAlternative import('@radix-ui/react-switch')
 */
export const Switch = ({
  checked,
  onCheckedChange,
  children,
  hint,
  size,
  variant,
  tooltip,
  id,
  className,
  style,
  ...props
}: SwitchProps) => {
  const { isDisabled, isReadOnly, stateTooltip } = useIsDisabled(props);
  const trackClassName = switchRecipe({ size, variant });

  return (
    <ControlChoice
      slot="switch"
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
      {(trackProps) => (
        // PlainButton makes the track pressable, with its state, tooltip and
        // reason; Radix makes it a switch.
        <SwitchPrimitive.Root
          asChild
          checked={checked}
          onCheckedChange={onCheckedChange}
        >
          <PlainButton
            {...props}
            {...trackProps}
            tooltip={tooltip}
            aria-readonly={isReadOnly || undefined}
          >
            <span
              data-slot="track"
              className={classNames(trackClassName, 'block shrink-0')}
            >
              <span data-slot="thumb" className="block" />
            </span>
          </PlainButton>
        </SwitchPrimitive.Root>
      )}
    </ControlChoice>
  );
};
