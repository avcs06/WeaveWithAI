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
        // Only on a native button: a wrapper's `type`, like Radix's, would
        // land on a non-button child.
        {...(isNativeButton && { type: type ?? 'button' })}
        role={isNativeButton ? undefined : 'button'}
        {...props}
        // Read-only isn't disabled; a child with a role that has a read-only
        // state, like a checkbox, says so itself.
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
