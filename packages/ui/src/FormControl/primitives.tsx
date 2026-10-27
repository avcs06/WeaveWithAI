'use client';

import { classNames } from '@packages/styles/classNames';
import { composeHandlers } from '@packages/utils/events';
import { Info } from 'lucide-react';
import React, { type MouseEvent } from 'react';

import { PlainButton } from '../Button';
import { Tooltip } from '../Tooltip';
import { Truncate } from '../Truncate';
import { createLook, hasContent, useIconAddon } from '../utils';

import {
  controlLabel,
  controlLineHeight,
  controlMessage,
  hintButton,
  requiredMark,
} from './FormControl.css';
import { formControlRecipe } from './FormControl.recipes.css';

import type {
  ControlBoxProps,
  ControlLabelProps,
  ControlMessageProps,
  FormControlOwnProps,
} from './FormControl.types';

const boxLook = createLook(formControlRecipe);

/**
 * The control's box: its look, icons, add-ons, spinner and tooltip. FormControl
 * draws it around the control; a control that is its own box renders it, and
 * FormControl passes it the state.
 */
export const ControlBox = ({
  size,
  variant,
  look,
  leftIcon,
  rightIcon,
  leftAddOn,
  rightAddOn,
  tooltip,
  status,
  isDisabled = false,
  isLoading = false,
  stateTooltip,
  controlRef,
  className,
  onMouseDown,
  onClick,
  children,
  ...props
}: ControlBoxProps) => {
  const { leftSlot, rightSlot } = useIconAddon({
    leftIcon,
    rightIcon,
    leftAddOn,
    rightAddOn,
    loading: isLoading,
    fixedHeight: controlLineHeight,
  });

  // A press on the box outside the control, like on an icon, focuses the
  // control instead of moving focus to the page.
  const focusControl = (event: MouseEvent<HTMLDivElement>) => {
    const control = controlRef?.current;
    const onControl =
      event.target instanceof Node && control?.contains(event.target);
    if (!control || onControl || isDisabled) return;
    event.preventDefault();
    control.focus();
  };

  // A cancelled click is what keeps the tooltip open with the reason, on
  // touch too, instead of closing it.
  const blockWhenDisabled = (event: MouseEvent<HTMLDivElement>) => {
    if (isDisabled) event.preventDefault();
  };

  const boxClassName = formControlRecipe({ variant, size, ...boxLook(look) });
  return (
    // FormControl describes the control, which may sit inside the box.
    <Tooltip tooltip={[tooltip, stateTooltip]} description={null}>
      <div
        {...props}
        data-slot="box"
        data-status={status}
        data-disabled={isDisabled || undefined}
        data-left={leftSlot ? true : undefined}
        data-right={rightSlot ? true : undefined}
        onMouseDown={composeHandlers(onMouseDown, focusControl)}
        onClick={composeHandlers(onClick, blockWhenDisabled)}
        className={classNames(
          boxClassName,
          'flex-row-gap-0 items-start',
          className,
        )}
      >
        {leftSlot}
        {children}
        {rightSlot}
      </div>
    </Tooltip>
  );
};

/** The label's row: the label, its required mark and hint, then `rightAddOn`. */
export const ControlLabel = ({
  id,
  htmlFor,
  label,
  required,
  hint,
  rightAddOn,
  tooltip,
  onClick,
}: ControlLabelProps) => {
  if (!label) return null;

  return (
    <div data-slot="label-row" className="flex-row-gap-2 items-center px-1">
      <div className="flex-fill-x inline-flex-row-gap-1 items-center">
        <label
          id={id}
          htmlFor={htmlFor}
          onClick={onClick}
          className={classNames(controlLabel, 'inline-flex-row-gap-0 min-w-0')}
        >
          <Truncate className="min-w-0" tooltip={tooltip}>
            {label}
          </Truncate>
          {required && (
            <span aria-hidden className={classNames(requiredMark, 'relative')}>
              *
            </span>
          )}
        </label>
        {hasContent(hint) && (
          <PlainButton tooltip={hint} aria-label={`About ${label}`}>
            <span
              className={classNames(hintButton, 'inline-flex items-center')}
            >
              <Info aria-hidden data-slot="icon" />
            </span>
          </PlainButton>
        )}
      </div>
      {rightAddOn}
    </div>
  );
};

/**
 * A field's status message: a live region kept on the page while empty, so a
 * message that appears is announced. Without a status it's styled as help
 * text.
 */
export const ControlMessage = ({
  id,
  status,
  message,
}: ControlMessageProps) => (
  <div
    id={id}
    role="status"
    data-slot="message"
    data-status={status}
    className={controlMessage}
  >
    {message}
  </div>
);

/**
 * The props a control puts on its own element: every prop but FormControl's.
 * `placeholder` stays, for native fields.
 *
 * @internal
 */
export const controlAttributes = <P extends FormControlOwnProps>({
  'aria-labelledby': ariaLabelledBy,
  id,
  name,
  label,
  hint,
  labelRightSlot,
  helpText,
  error,
  warning,
  success,
  required,
  size,
  variant,
  look,
  tooltip,
  ref,
  leftIcon,
  rightIcon,
  leftAddOn,
  rightAddOn,
  disabled,
  disabledWithReason,
  readOnly,
  readOnlyWithReason,
  loading,
  loadingWithReason,
  disableWhileLoading,
  ...attributes
}: P) => attributes;
