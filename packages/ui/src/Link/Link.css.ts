import { tokens } from '@packages/styles/tokens.css';
import { disabledColor, focusRing } from '@packages/styles/utils';
import { createVar, style } from '@vanilla-extract/css';

export const linkFg = createVar('linkFg');
export const linkBorder = createVar('linkBorder');
export const linkFocusColor = createVar('linkFocusColor');

const dotSize = tokens.spacing[0.25];
const dotSpacing = tokens.spacing[1];

// A dotted line instead of an underline.
const dottedLine = (color: string) =>
  `linear-gradient(to right, ${color} ${dotSize}, transparent ${dotSize})`;

export const link = style({
  color: linkFg,
  textDecoration: 'none',
  backgroundImage: dottedLine(linkBorder),
  backgroundSize: `${dotSpacing} ${dotSize}`,
  backgroundRepeat: 'repeat-x',
  backgroundPosition: 'left bottom',
  outline: 'none',
  selectors: {
    '&:not([data-disabled]):is(:focus-visible, :active)': {
      borderRadius: tokens.radius[1],
      ...focusRing(linkFocusColor),
    },
    '&[data-disabled]': {
      color: disabledColor(linkFg),
      backgroundImage: dottedLine(disabledColor(linkBorder)),
    },
    // A disabled link with a reason keeps its tab stop: its focus shows,
    // dimmed.
    '&[data-disabled]:focus-visible': {
      borderRadius: tokens.radius[1],
      ...focusRing(disabledColor(linkFocusColor)),
    },
  },
});
