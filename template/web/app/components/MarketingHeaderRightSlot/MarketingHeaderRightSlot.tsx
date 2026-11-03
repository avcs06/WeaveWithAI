'use client';

import { useThemeMode } from '@packages/styles/useThemeMode';
import { Button } from '@packages/ui/Button';
import React from 'react';

/**
 * The right end of the public site's header, over its pages. PageLayout
 * renders the bar and keeps this slot at its right end. It lays these
 * items in a row with the theme's gap.
 *
 * Holds, as the theme names them:
 * - Sign up as the main action, `Button as={NextLink}` to the sign-up page,
 *   unless the landing page's hero offers it.
 * - Code places `UserMenu` here when the theme puts the account at the
 *   header's right: Sign in for a visitor, the account menu for a member.
 *   Keep it last, as it is.
 *
 * Leaves out:
 * - A wrapper, height, padding, background or border: PageLayout draws the
 *   bar.
 * - A page's own actions: they go in the page's `PageHeader` from
 *   `@app/components/PageHeader`.
 */
export const MarketingHeaderRightSlot = () => {
  const { mode, toggle } = useThemeMode();

  return (
    <Button onClick={toggle}>
      {mode === 'light' ? 'Dark mode' : 'Light mode'}
    </Button>
  );
};
