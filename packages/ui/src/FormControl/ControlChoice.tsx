'use client';

import { classNames } from '@packages/styles/classNames';
import React, { useId, useRef } from 'react';

import { hasContent, joinIds } from '../utils';

import { ControlLabel } from './auxiliary';
import { controlChoice } from './FormControl.css';

import type { ControlChoiceProps } from './FormControl.types';

/**
 * A checkbox or radio with its label to its right: the label, its required
 * mark and hint are a ControlLabel. The box, a PlainButton, shows its own
 * tooltip and reason.
 *
 * @internal
 */
export const ControlChoice = ({
  slot,
  id,
  label,
  hint,
  required,
  isDisabled,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  className,
  style,
  children,
}: ControlChoiceProps) => {
  const generatedId = useId();
  const labelId = useId();
  const hintId = useId();
  const boxRef = useRef<HTMLElement | null>(null);
  // The hint shows on hover of its icon; the box is described by it too.
  const hasHint = Boolean(label) && hasContent(hint);

  const boxId = id ?? generatedId;

  return (
    <div
      data-slot={slot}
      data-disabled={isDisabled || undefined}
      style={style}
      className={classNames(
        controlChoice,
        'inline-flex-row-gap-1.5 items-center max-w-full',
        className,
      )}
    >
      {children({
        ref: (node) => {
          boxRef.current = node;
        },
        id: boxId,
        'aria-labelledby': label ? labelId : ariaLabelledBy,
        'aria-describedby': joinIds(ariaDescribedBy, hasHint && hintId),
      })}
      <ControlLabel
        id={labelId}
        htmlFor={boxId}
        label={label}
        required={required}
        hint={hint}
        rightAddOn={null}
        // The box isn't a native control, so the label presses it itself.
        onClick={(event) => {
          event.preventDefault();
          boxRef.current?.click();
        }}
      />
      {hasHint && (
        <span id={hintId} hidden>
          {hint}
        </span>
      )}
    </div>
  );
};
