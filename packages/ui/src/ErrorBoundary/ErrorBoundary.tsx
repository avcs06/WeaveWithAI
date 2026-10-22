'use client';

import { classNames } from '@packages/styles/classNames';
import { CircleAlert } from 'lucide-react';
import React, { Component, type ErrorInfo } from 'react';

import {
  fallback as fallbackClassName,
  fallbackIcon,
} from './ErrorBoundary.css';

import type {
  ErrorBoundaryProps,
  ErrorBoundaryState,
} from './ErrorBoundary.types';

/**
 * Shows a fallback in place of `children` once they throw while rendering.
 * It stays on the fallback: give it a new `key` to render `children` again.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { failed: false };

  // A boolean, not the error: `throw null` must still show the fallback.
  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  render() {
    const { children, fallback } = this.props;
    if (!this.state.failed) return children;
    if (fallback !== undefined) return fallback;

    return (
      <div
        role="alert"
        className={classNames(
          fallbackClassName,
          'flex-row-gap-2 items-center justify-center p-6-4',
        )}
      >
        <CircleAlert
          aria-hidden
          className={classNames(fallbackIcon, 'icon-size-body shrink-0')}
        />
        Something went wrong.
      </div>
    );
  }
}
