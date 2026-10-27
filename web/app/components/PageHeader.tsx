'use client';

import { classNames } from '@packages/styles/classNames';
import { useThemeMode } from '@packages/styles/useThemeMode';
import { Button } from '@packages/ui/Button';

import { NextLink } from './NextLink';
import * as styles from './PageHeader.css';

export const PageHeader = () => {
  const { mode, toggle } = useThemeMode();

  return (
    <header
      className={classNames(styles.header, 'flex-row-gap-4 items-center px-6')}
    >
      <NextLink href="/" look="plain">
        Application starter
      </NextLink>
      <div className="flex-1" />
      <Button onClick={toggle}>
        {mode === 'light' ? 'Dark mode' : 'Light mode'}
      </Button>
    </header>
  );
};
