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

/**
 * Button behavior with no look, for an element that must act as a button but
 * keep its own look: an avatar, an info icon, an image. Its one child, a
 * non-interactive element like a `span` or `img`, becomes the button: named,
 * focusable, pressed by Enter and Space. A styled action is a Button or
 * IconButton; a card is a Card.
 *
 * @invalidAlternative [role="button"], div[onClick]:not([role]), span[onClick]:not([role]), li[onClick]:not([role]), p[onClick]:not([role]), i[onClick]:not([role]), img[onClick], svg[onClick], a[onClick]:not([href]), Avatar[onClick]
 */
export const PlainButton = ({
  tooltip,
  disabled,
  disabledWithReason,
  readOnly,
  readOnlyWithReason,
  loading,
  loadingWithReason,
  disableWhileLoading,
  type,
  tabIndex,
  onClick,
  onPointerDown,
  onKeyDown,
  onKeyUp,
  children,
  ...props
}: PlainButtonProps) => {
  const { isDisabled, isReadOnly, isFocusable, stateTooltip } = useIsDisabled({
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

  // A native button activates itself; others get Enter on key down, Space on
  // key up.
  const activate = (event: KeyboardEvent<HTMLElement>, key: string) => {
    if (isNativeButton || isDisabled || event.defaultPrevented) return;
    if (event.key === ' ') event.preventDefault();
    if (event.key === key) event.currentTarget.click();
  };

  // The child's handlers are guarded too; each runs once, then PlainButton's.
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
        // Native button only: a wrapper's `type` (Radix's) would land on a
        // non-button child.
        {...(isNativeButton && { type: type ?? 'button' })}
        role={isNativeButton ? undefined : 'button'}
        {...props}
        // Read-only isn't disabled; a child role with read-only state
        // (checkbox) sets it itself.
        aria-disabled={(isDisabled && !isReadOnly) || undefined}
        data-disabled={isDisabled || undefined}
        tabIndex={
          isFocusable ? (tabIndex ?? (isNativeButton ? undefined : 0)) : -1
        }
      >
        {guardedChild}
      </Slot>
    </Tooltip>
  );
};
