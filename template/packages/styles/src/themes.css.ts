import { style } from '@vanilla-extract/css';

// eslint-disable-next-line @nx/enforce-module-boundaries
import { lightTheme, darkTheme } from '../../../colors';

export type ThemeMode = 'light' | 'dark';

export const themeClasses = {
  light: style({
    vars: lightTheme,
  }),
  dark: style({
    vars: darkTheme,
  }),
};
