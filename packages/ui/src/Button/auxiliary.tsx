'use client';

import { Slot } from '@radix-ui/react-slot';
import React, {
  Children,
  cloneElement,
  type KeyboardEvent,
  type ReactElement,
} from 'react';

import { Tooltip } from '../Tooltip';
import { useIsDisabled } from '../utils';

import { guardActivation } from './Button';

import type { ActivationHandlers, PlainButtonProps } from './Button.types';

/** Button behavior, no look: the child is the button. */
export const PlainButton = ({
  tooltip,
  disabled,
  disabledWithReason,
  readOnly,
  readOnlyWithReason,
  loading,
  loadingWithReason,
  disableWhileLoading,
  tabIndex,
  onClick,
  onPointerDown,
  onKeyDown,
  onKeyUp,
  children,
  ...props
}: PlainButtonProps) => {
  const { isDisabled, stateTooltip } = useIsDisabled({
    disabled,
    disabledWithReason,
    readOnly,
    readOnlyWithReason,
    loading,
    loadingWithReason,
    disableWhileLoading,
  });

  const child = Children.only(children) as ReactElement<ActivationHandlers>;
  const isNativeButton = child.type === 'button';

  // A native button activates itself; any other element is given Enter on
  // key down and Space on key up, as a button has.
  const activate = (event: KeyboardEvent<HTMLElement>, key: string) => {
    if (isNativeButton || isDisabled || event.defaultPrevented) return;
    if (event.key === ' ') event.preventDefault();
    if (event.key === key) event.currentTarget.click();
  };

  // The child's own handlers are guarded too: they run after the guard, then
  // PlainButton's, each once.
  const guarded = guardActivation(isDisabled, {
    onClick: (event) => {
      child.props.onClick?.(event);
      onClick?.(event);
    },
    onPointerDown: (event) => {
      child.props.onPointerDown?.(event);
      onPointerDown?.(event);
    },
    onKeyDown: (event) => {
      child.props.onKeyDown?.(event);
      onKeyDown?.(event);
      activate(event, 'Enter');
    },
  });

  const guardedChild = cloneElement(child, {
    ...guarded,
    onKeyUp: (event: KeyboardEvent<HTMLElement>) => {
      child.props.onKeyUp?.(event);
      onKeyUp?.(event);
      activate(event, ' ');
    },
  });

  return (
    <Tooltip tooltip={[tooltip, stateTooltip]}>
      <Slot
        type={isNativeButton ? 'button' : undefined}
        role={isNativeButton ? undefined : 'button'}
        {...props}
        aria-disabled={isDisabled || undefined}
        data-disabled={isDisabled || undefined}
        tabIndex={
          isDisabled ? -1 : (tabIndex ?? (isNativeButton ? undefined : 0))
        }
      >
        {guardedChild}
      </Slot>
    </Tooltip>
  );
};
