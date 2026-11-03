'use client';

import { useThemeMode } from '@packages/styles/useThemeMode';
import { Button } from '@packages/ui/Button';

import { PageLogo } from './PageLogo';

/** The starter layout's header content: the logo and the mode switch. */
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
