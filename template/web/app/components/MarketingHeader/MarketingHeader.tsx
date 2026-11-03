'use client';

import { useThemeMode } from '@packages/styles/useThemeMode';
import { Button } from '@packages/ui/Button';
import React from 'react';

import { PageLogo } from '../PageLogo';

/**
 * The public site's header items, over the landing page, sign in and sign up.
 * PageLayout renders the bar: its height, padding, background, separation,
 * sticking and overlay. It lays these items in a row with the theme's gap,
 * centered in the bar.
 *
 * Holds, as the theme names them:
 * - Links to the site's own pages or sections: a `NextLink` from
 *   `@app/components/NextLink` each.
 * - Sign up as the main action, a `Button as={NextLink}`, unless the landing
 *   page's hero offers it.
 * - `<div className="flex-1" />` before the items that sit at the end.
 * - Code places `PageLogo` here when the theme puts the logo in the header,
 *   and `UserMenu`, Sign in for a visitor, when it puts the account here.
 *   Keep them as they are.
 *
 * Leaves out:
 * - A `header` element, height, padding, background or border: PageLayout
 *   draws the bar.
 * - The hero's headline and its H1: they belong to the landing page.
 * - Pages and links the scope and the flows don't have.
 */
export const MarketingHeader = () => {
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
