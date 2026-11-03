'use client';

import { useThemeMode } from '@packages/styles/useThemeMode';
import { Button } from '@packages/ui/Button';

import { NextLink } from './NextLink';
import { Wordmark } from './Wordmark';

/** The starter page's header content: the wordmark and the mode switch. */
export const PageHeader = () => {
  const { mode, toggle } = useThemeMode();

  return (
    <>
      <NextLink href="/" look="plain">
        <Wordmark>Application starter</Wordmark>
      </NextLink>
      <div className="flex-1" />
      <Button onClick={toggle}>
        {mode === 'light' ? 'Dark mode' : 'Light mode'}
      </Button>
    </>
  );
};
