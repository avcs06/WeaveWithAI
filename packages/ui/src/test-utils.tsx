import { render, type RenderOptions } from '@testing-library/react';
import { configureAxe } from 'jest-axe';
import React, { type ReactElement, type ReactNode } from 'react';

// Not the barrel: UIRoot loads next/font, which jest can't.
import { UIProviders } from './Root/UIProviders';

/**
 * Page-level rules (landmarks) don't apply to a component rendered alone.
 * jsdom has no layout, so axe can't check colour contrast here either.
 */
export const axe = configureAxe({ rules: { region: { enabled: false } } });

// Tooltips open at once, so a test needn't wait for them.
export const Providers = ({ children }: { children: ReactNode }) => (
  <UIProviders tooltipDelay={0}>{children}</UIProviders>
);

/** Renders inside the providers `Root` gives the app. */
export const renderUI = (ui: ReactElement, options?: RenderOptions) =>
  render(ui, { wrapper: Providers, ...options });
