'use client';

import { useThemeMode } from '@packages/styles/useThemeMode';
import { Button } from '@packages/ui/Button';
import React from 'react';

import { PageLogo } from '../PageLogo';

/**
 * The app layout's header items. PageLayout renders the bar: its height,
 * padding, background, separation and sticking. It lays these items in a row
 * with the theme's gap, centered in the bar.
 *
 * Holds, as the theme names them:
 * - The app's main action, such as Create: a `Button` from
 *   `@packages/ui/Button`.
 * - The navigation, when the layout has no sidebar: a `NextLink` from
 *   `@app/components/NextLink` per destination, the current one marked
 *   `aria-current="page"`.
 * - `<div className="flex-1" />` before the items that sit at the end.
 * - Code places `PageLogo` and `UserMenu` here when the theme puts the logo
 *   or the account in the header. Keep them as they are.
 *
 * Leaves out:
 * - A `header` element, height, padding, background or border: PageLayout
 *   draws the bar.
 * - An H1, a page's title or its actions: they go in the page's `PageHeader`
 *   from `@app/components/PageHeader`.
 * - What the sidebar holds, and search, help or settings with no flow.
 */
export const AppHeader = () => {
  const { mode, toggle } = useThemeMode();

  return (
    <>
      <PageLogo />
      <div className="flex-1" />
      <Button onClick={toggle}>
        {mode === 'light' ? 'Dark mode' : 'Light mode'}
      </Button>
    </>
  );
};
