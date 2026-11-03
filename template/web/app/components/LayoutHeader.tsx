'use client';

import { useThemeMode } from '@packages/styles/useThemeMode';
import { Button } from '@packages/ui/Button';

import { PageLogo } from './PageLogo';

/**
 * The header's items. PageLayout renders the bar: its height, padding,
 * background, separation and sticking. It lays these items in a row with the
 * theme's gap, centered in the bar. The starter holds the logo and the mode
 * switch.
 *
 * Holds, as the layout's header names them:
 * - The logo first: `PageLogo` from `@app/components/PageLogo`, as it is.
 * - In a small app, the navigation: a `NextLink` from
 *   `@app/components/NextLink` per destination, the current one marked
 *   `aria-current="page"`. A larger app keeps its navigation in the sidebar.
 * - The app's main action, such as Create: a `Button` from
 *   `@packages/ui/Button`.
 * - The account last: `UserMenu` from `@app/components/UserMenu`, with
 *   `placement="header"`. Signed out, it shows Sign in.
 * - `<div className="flex-1" />` before the items that sit at the end.
 *
 * Leaves out:
 * - A `header` element, height, padding, background or border: PageLayout
 *   draws the bar.
 * - An H1, a page's title or its actions: they go in the page's `PageHeader`
 *   from `@app/components/PageHeader`.
 * - Search, help or settings with no flow behind them.
 * - What the sidebar already holds.
 */
export const LayoutHeader = () => {
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
