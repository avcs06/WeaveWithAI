'use client';

import { useThemeMode } from '@packages/styles/useThemeMode';
import { Button } from '@packages/ui/Button';
import React from 'react';

/**
 * The right end of the app's header bar.
 *
 * Put here, in this order:
 * - The app's main action, when the theme puts it here. Use a `Button` from
 *   `@packages/ui/Button`. Example: "New invoice".
 * - The account. Code places `UserMenu` here when the theme puts the
 *   account at the right. It shows Sign in to a visitor and the account
 *   menu to a member. Keep it last, as it is.
 *
 * PageLayout draws the bar and lays these items in a row. Return only the
 * items: no wrapper, height, padding, background or border.
 *
 * Never put here:
 * - A page's own actions. They go in the page's `PageHeader`.
 *
 * The line "The theme puts here" below names this app's items. Build those
 * and nothing else.
 */
export const AppHeaderRightSlot = () => {
  const { mode, toggle } = useThemeMode();

  return (
    <Button onClick={toggle}>
      {mode === 'light' ? 'Dark mode' : 'Light mode'}
    </Button>
  );
};
