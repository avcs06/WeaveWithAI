'use client';

import { classNames } from '@packages/styles/classNames';
import { CircleAlert } from 'lucide-react';
import { unstable_rethrow } from 'next/navigation';
import React, { Component, createRef, type ErrorInfo } from 'react';

import { Button } from '../Button';

import {
  fallback as fallbackClassName,
  fallbackIcon,
} from './ErrorBoundary.css';

import type {
  ErrorBoundaryProps,
  ErrorBoundaryState,
} from './ErrorBoundary.types';

const keysChanged = (
  previous: readonly unknown[] = [],
  next: readonly unknown[] = [],
) =>
  previous.length !== next.length ||
  previous.some((key, index) => !Object.is(key, next[index]));

/**
 * Shows a fallback in place of `children` once they throw while rendering,
 * so one broken part doesn't take down the page. It doesn't catch errors in
 * event handlers, effects, promises or iframes. The fallback can offer to
 * render `children` again (`reset`), and `resetKeys` does it on its own.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { failed: false };

  private fallbackRef = createRef<HTMLDivElement>();

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    // Redirects and not-found are Next's to handle, not failures.
    unstable_rethrow(error);
    // A flag besides the error: `throw null` must still show the fallback.
    return { failed: true, error };
  }

  getSnapshotBeforeUpdate(_: ErrorBoundaryProps, previous: ErrorBoundaryState) {
    return !previous.failed && this.state.failed
      ? document.activeElement
      : null;
  }

  componentDidUpdate(
    previousProps: ErrorBoundaryProps,
    previous: ErrorBoundaryState,
    focused: Element | null,
  ) {
    if (
      previous.failed &&
      this.state.failed &&
      keysChanged(previousProps.resetKeys, this.props.resetKeys)
    ) {
      this.reset();
      return;
    }

    // The fallback replaced the focused element: keyboard users keep their
    // place at the fallback's first control.
    if (focused && !focused.isConnected) {
      const fallback = this.fallbackRef.current;
      const target = fallback?.querySelector<HTMLElement>(
        'a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
      );
      (target ?? fallback)?.focus();
    }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  reset = () => this.setState({ failed: false, error: undefined });

  render() {
    const { children, fallback } = this.props;
    const { failed, error } = this.state;
    if (!failed) return children;

    const content =
      typeof fallback === 'function'
        ? fallback({ error, reset: this.reset })
        : fallback;
    if (fallback !== undefined && (content == null || content === false))
      return null;

    return (
      <div
        ref={this.fallbackRef}
        role="alert"
        tabIndex={-1}
        data-slot="fallback"
        className={classNames(
          fallbackClassName,
          'flex-row-gap-2 flex-wrap items-center justify-center p-6-4',
        )}
      >
        {fallback === undefined ? (
          <>
            <CircleAlert
              aria-hidden
              data-slot="icon"
              className={classNames(fallbackIcon, 'icon-size-body shrink-0')}
            />
            Something went wrong.
            <Button onClick={this.reset}>Try again</Button>
          </>
        ) : (
          content
        )}
      </div>
    );
  }
}
