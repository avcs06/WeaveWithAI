import type { StyleRule } from '@vanilla-extract/css';

// An `as` target contributes its own classes; Button owns the root's look.
export const buttonStyle = ({
  selectors = {},
  ...styles
}: StyleRule): StyleRule => ({
  selectors: {
    '&&&': styles,
    ...Object.fromEntries(
      Object.entries(selectors).map(([selector, rule]) => [
        selector.replaceAll('&', '&&&'),
        rule,
      ]),
    ),
  },
});