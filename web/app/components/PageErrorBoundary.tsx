'use client';

import { ErrorBoundary } from '@packages/ui/ErrorBoundary';
import { usePathname } from 'next/navigation';
import React, { type ReactNode } from 'react';

/**
 * The error boundary around every page: a page that throws shows the
 * fallback, and the next navigation tries again. The path is only known on
 * the client, so this sits inside UIRoot, a server component.
 */
export const PageErrorBoundary = ({ children }: { children: ReactNode }) => (
  <ErrorBoundary resetKeys={[usePathname()]}>{children}</ErrorBoundary>
);
