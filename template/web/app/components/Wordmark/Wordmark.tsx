import React from 'react';

import { wordmark } from './Wordmark.css';
import type { WordmarkProps } from './Wordmark.types';

/** The app name in the theme's wordmark styling, without navigation. */
export const Wordmark = ({ children }: WordmarkProps) => (
  <span className={wordmark}>{children}</span>
);