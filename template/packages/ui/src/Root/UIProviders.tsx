import React from 'react';

import { TooltipProvider } from '../Tooltip';

import type { UIProvidersProps } from './UIRoot.types';

/**
 * The providers UIRoot gives the app, for a root that isn't the document,
 * like a test's render.
 *
 * @internal
 */
export const UIProviders = ({
  tooltipDelay = 200,
  children,
}: UIProvidersProps) => (
  <TooltipProvider delayDuration={tooltipDelay}>{children}</TooltipProvider>
);
