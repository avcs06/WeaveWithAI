import { classNames } from '@packages/styles/classNames';
import React from 'react';

import { NextLink } from '../NextLink';

import * as styles from './PageLogo.css';

import type { PageLogoProps } from './PageLogo.types';

// The scaffold writes the app's name over this.
const APP_NAME = 'Application starter';

/**
 * The app's logo: its name in the theme's logo style, with an optional icon
 * on either side, all one link home. Place it as it is; the theme and the
 * scaffold set its name and look.
 */
export const PageLogo = ({ leftIcon, rightIcon }: PageLogoProps) => (
  <NextLink
    href="/"
    look="plain"
    // Marked, so the rendered checks find the logo in every frame.
    data-page-logo=""
    className={classNames('inline-flex-row-gap-2 items-center', styles.link)}
  >
    {leftIcon}
    <span className={styles.logo}>{APP_NAME}</span>
    {rightIcon}
  </NextLink>
);
