import type { ErrorInfo, ReactNode } from 'react';

export type ErrorBoundaryFallbackProps = {
  error: unknown;
  /** Renders `children` again. */
  reset: () => void;
};

export type ErrorBoundaryProps = {
  children: ReactNode;
  /**
   * Shown in place of `children` once something below throws, inside an
   * alert; `null` renders nothing. Without it, the boundary shows
   * "Something went wrong." and a "Try again" button. A function gets the
   * `error` and a `reset`.
   */
  fallback?: ReactNode | ((props: ErrorBoundaryFallbackProps) => ReactNode);
  /** While failed, a change in any of these renders `children` again. */
  resetKeys?: readonly unknown[];
  onError?: (error: unknown, info: ErrorInfo) => void;
};

export type ErrorBoundaryState = { failed: boolean; error?: unknown };
