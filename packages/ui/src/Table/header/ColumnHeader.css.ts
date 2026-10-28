import { tokens } from '@packages/styles/tokens.css';
import { style } from '@vanilla-extract/css';

// Header items are pulled out 4px and padded 4px back, so text stays at 6px
// and button backgrounds reach 2px from the cell edge.
export const headerContent = style({
  marginInline: `calc(${tokens.spacing[1.5]} * -1)`,
});

// Scoped to the header content to outrank the button's padding and type styles
// regardless of stylesheet order.
export const headerItem = style({
  selectors: {
    [`${headerContent} > &`]: {
      paddingInline: tokens.spacing[1.5],
      fontSize: tokens.fontSize.label,
      lineHeight: tokens.lineHeight.label,
      fontWeight: tokens.fontWeight.label,
    },
  },
});
