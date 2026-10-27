'use client';

import { classNames } from '@packages/styles/classNames';
import { useLatestRef } from '@packages/utils/hooks';
import React, {
  type ComponentPropsWithoutRef,
  type RefObject,
  useEffect,
} from 'react';

import { Tooltip } from '../Tooltip';

import { useTruncation } from './useTruncation';

import type { TruncateProps } from './Truncate.types';

type HostFocusHandler = (event: {
  currentTarget: HTMLElement;
  defaultPrevented: boolean;
}) => void;

type TruncateTextProps = Omit<
  ComponentPropsWithoutRef<'span'>,
  'onFocus' | 'onBlur'
> & {
  ref: RefObject<HTMLSpanElement | null>;
  onFocus?: HostFocusHandler;
  onBlur?: HostFocusHandler;
};

// The text can't take focus, so the control around it shows its tooltip.
// Handlers are only given when the tooltip has something to show.
const TruncateText = ({
  ref,
  onFocus,
  onBlur,
  ...props
}: TruncateTextProps) => {
  const onFocusRef = useLatestRef(onFocus);
  const onBlurRef = useLatestRef(onBlur);
  const hasHandlers = Boolean(onFocus || onBlur);

  useEffect(() => {
    const host = ref.current?.parentElement?.closest<HTMLElement>(
      'a[href], button, summary, [tabindex]',
    );
    if (!hasHandlers || !host) return;

    const event = { currentTarget: host, defaultPrevented: false };
    const show = (focusEvent: FocusEvent) => {
      if (focusEvent.target === host && host.matches(':focus-visible'))
        onFocusRef.current?.(event);
    };
    const hide = (focusEvent: FocusEvent) => {
      if (focusEvent.target === host) onBlurRef.current?.(event);
    };

    host.addEventListener('focusin', show);
    host.addEventListener('focusout', hide);

    return () => {
      host.removeEventListener('focusin', show);
      host.removeEventListener('focusout', hide);
    };
  }, [ref, hasHandlers, onFocusRef, onBlurRef]);

  return <span ref={ref} {...props} />;
};

/**
 * One line of text that ends in an ellipsis when it doesn't fit, with the
 * full text in a tooltip. For a tooltip of your own, use `tooltip` rather than
 * wrapping it in a `Tooltip`.
 *
 * @invalidAlternative .truncate, .text-ellipsis
 */
export const Truncate = ({
  tooltip,
  alwaysShowTooltip = false,
  className,
  children,
  ...props
}: TruncateProps) => {
  const {
    ref,
    className: truncateClassName,
    truncated,
  } = useTruncation<HTMLSpanElement>();

  const showTooltip = alwaysShowTooltip || truncated;

  return (
    <Tooltip tooltip={[tooltip, showTooltip && children]} description={tooltip}>
      <TruncateText
        {...props}
        ref={ref}
        className={classNames(truncateClassName, 'block', className)}
      >
        {children}
      </TruncateText>
    </Tooltip>
  );
};
