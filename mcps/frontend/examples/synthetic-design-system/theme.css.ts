import { createGlobalTheme } from '@vanilla-extract/css';

/**
 * Synthetic color theme resolved inline, so this file alone has real values for
 * `list_tokens` and `validate` suggestions.
 */
export const vars = createGlobalTheme(':root', {
  color: {
    surface: '#FFFFFF',
    foreground: '#1A1A1A',
    accent: '#3B5BDB',
    accentHover: '#364FC7',
    danger: '#C92A2A',
  },
});
