import type { ErrorInfo, ReactNode } from 'react';

export type ErrorBoundaryProps = {
  children: ReactNode;
  /**
   * Rendered instead of `children` once something below throws; `null`
   * renders nothing. Without it, the boundary shows "Something went wrong."
   */
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
};

export type ErrorBoundaryState = { failed: boolean };
