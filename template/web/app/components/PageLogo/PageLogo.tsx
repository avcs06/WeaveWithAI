import React from 'react';

import { NextLink } from '../NextLink';

import { logo } from './PageLogo.css';

// The scaffold writes the app's name over this.
const APP_NAME = 'Application starter';

/**
 * The app's logo: its name in the theme's logo style, linking home. Place it
 * as it is; the theme and the scaffold set its name and look.
 */
export const PageLogo = () => (
  <NextLink href="/" look="plain">
    <span className={logo}>{APP_NAME}</span>
  </NextLink>
);
