import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { render, type RenderOptions } from '@testing-library/react';
import { configureAxe } from 'jest-axe';
import React, { type ReactElement, type ReactNode } from 'react';

/**
 * Page-level rules (landmarks) don't apply to a component rendered alone.
 * jsdom has no layout, so axe can't check colour contrast here either.
 */
export const axe = configureAxe({ rules: { region: { enabled: false } } });

export const Providers = ({ children }: { children: ReactNode }) => (
  // `Root` provides this in the app; tooltips need it.
  <TooltipPrimitive.Provider delayDuration={0}>
    {children}
  </TooltipPrimitive.Provider>
);

/** Renders inside the providers `Root` gives the app. */
export const renderUI = (ui: ReactElement, options?: RenderOptions) =>
  render(ui, { wrapper: Providers, ...options });
