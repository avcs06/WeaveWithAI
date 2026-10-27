'use client';

import { classNames } from '@packages/styles/classNames';
import { Slot } from '@radix-ui/react-slot';
import React, { type MouseEvent, useId, useRef } from 'react';

import { hasContent, joinIds, mergeRefs, useIsDisabled } from '../utils';

import { controlMessage } from './FormControl.css';
import { ControlBox, ControlLabel, ControlMessage } from './primitives';

import type {
  ControlBoxState,
  ControlProps,
  FormControlOwnProps,
  FormControlProps,
  ControlStatus,
} from './FormControl.types';

const statuses: readonly ControlStatus[] = ['error', 'warning', 'success'];

/** Only the winning status styles the field and shows its message. */
const winningStatus = (levels: Pick<FormControlOwnProps, ControlStatus>) => {
  const status = statuses.find((level) => levels[level]);
  const value = status && levels[status];
  return { status, message: typeof value === 'string' ? value : undefined };
};

/**
 * A form field's label, control box, and help text or status message, around
 * a control the design system has no component for. Input, NumberInput,
 * PasswordInput, SearchInput and Select are built on it: use those when they
 * fit. With `Controller`, `{...field}` is all it needs.
 *
 * @invalidAlternative label, [aria-invalid], [aria-required], [aria-errormessage]
 */
export const FormControl = ({
  'aria-labelledby': ariaLabelledBy,
  id,
  name,
  label,
  placeholder,
  hint,
  labelRightSlot,
  helpText,
  error,
  warning,
  success,
  required = false,
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
  withControlBox = true,
  className,
  children,
}: FormControlProps) => {
  const generatedId = useId();
  const labelId = useId();
  const hintId = useId();
  const tooltipId = useId();
  const reasonId = useId();
  const messageId = useId();
  const helpId = useId();
  const controlRef = useRef<HTMLElement>(null);

  const { isLoading, isDisabled, isReadOnly, isFocusable, stateTooltip } =
    useIsDisabled({
      disabled,
      disabledWithReason,
      readOnly,
      readOnlyWithReason,
      loading,
      loadingWithReason,
      disableWhileLoading,
    });

  const { status, message } = winningStatus({ error, warning, success });
  const controlId = id ?? generatedId;

  // Hover-only text, also kept hidden in the page for screen readers.
  const hiddenDescriptions = [
    { id: hintId, text: label && hint },
    { id: tooltipId, text: tooltip },
    { id: reasonId, text: stateTooltip },
  ].filter(({ text }) => hasContent(text));

  const controlProps: ControlProps = {
    id: controlId,
    name: name ?? label ?? placeholder ?? controlId,
    ref: mergeRefs(ref, controlRef),
    tabIndex: isFocusable || isReadOnly ? 0 : -1,
    'aria-labelledby': joinIds(label && labelId, ariaLabelledBy),
    // The message first: it says what's wrong, the help text what's asked.
    'aria-describedby': joinIds(
      hasContent(message) && messageId,
      hasContent(helpText) && helpId,
      ...hiddenDescriptions.map((description) => description.id),
    ),
    'aria-invalid': status === 'error' || undefined,
    'aria-required': required || undefined,
    'aria-disabled': (isDisabled && !isReadOnly) || undefined,
    'aria-readonly': isReadOnly || undefined,
    'aria-busy': isLoading || undefined,
    'data-slot': 'control',
    'data-disabled': isDisabled || undefined,
    isDisabled,
  };

  // Every control, native or not, takes focus from its label, unless it left
  // the tab order.
  const focusFromLabel = (event: MouseEvent<HTMLLabelElement>) => {
    event.preventDefault();
    if (isFocusable || isReadOnly) controlRef.current?.focus();
  };

  const box: ControlBoxState = {
    size,
    variant,
    look,
    leftIcon,
    rightIcon,
    leftAddOn,
    rightAddOn,
    tooltip,
    status,
    isDisabled,
    isLoading,
    stateTooltip,
    controlRef,
  };

  const control = children(controlProps);
  return (
    <div
      data-slot="form-control"
      className={classNames('flex-col-gap-2', className)}
    >
      <ControlLabel
        id={labelId}
        htmlFor={controlId}
        label={label}
        required={required}
        hint={hint}
        rightAddOn={labelRightSlot}
        onClick={focusFromLabel}
      />
      {withControlBox ? (
        <ControlBox {...box}>{control}</ControlBox>
      ) : (
        // The control is its own box: it gets the box's props.
        <Slot {...box}>{control}</Slot>
      )}
      {hasContent(helpText) && (
        <div id={helpId} data-slot="help" className={controlMessage}>
          {helpText}
        </div>
      )}
      <ControlMessage id={messageId} status={status} message={message} />
      {hiddenDescriptions.map((description) => (
        <span key={description.id} id={description.id} hidden>
          {description.text}
        </span>
      ))}
    </div>
  );
};
