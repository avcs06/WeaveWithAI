import { tokens } from '@packages/styles/tokens.css';
import { globalStyle, style } from '@vanilla-extract/css';

// eslint-disable-next-line import-rules/barrel-only-sibling-imports -- the shell's and the row's looks, which the sidebar overrides.
import { menu, menuItem } from '../Menu/Menu.css';

const surface = tokens.color.surface;
const brand = tokens.color.primary;

// Menu's shell and spacing without a menu's chrome: no edge, shadow or size
// cap, and the height the sidebar gives it, on the sidebar's own background.
export const sidebarMenu = style({
  selectors: {
    [`${menu}&`]: {
      minWidth: 0,
      maxWidth: 'none',
      maxHeight: 'none',
      height: '100%',
      borderRadius: 0,
      background: 'transparent',
      boxShadow: 'none',
      color: surface.pageFg,
    },
  },
});

// The footer stays at the bottom while the list is short; a long list shrinks
// and scrolls above it.
globalStyle(`${sidebarMenu} > [data-slot='footer']`, { marginTop: 'auto' });

// The same 6px as between the header's and footer's rows, wider than a
// dropdown's rows.
globalStyle(`${sidebarMenu} [data-slot='list']`, { gap: tokens.spacing[1.5] });

// A row on the frame's background: the page's text, a faint hover, and the
// brand's selected fill on the current page. A link child brings the link's
// dotted line and color, which the row replaces.
export const sidebarMenuItem = style({
  selectors: {
    [`${menuItem}&`]: {
      color: surface.pageFg,
      backgroundImage: 'none',
      textDecoration: 'none',
    },
    [`${menuItem}&:not([data-disabled]):not([data-selected]):hover`]: {
      background: `color-mix(in srgb, ${surface.pageFg} 8%, transparent)`,
    },
    [`${menuItem}&[data-selected]`]: {
      background: brand.hoverBg,
      color: brand.fg,
    },
  },
});

// A header's or footer's row: the link rows' inset around a piece with its own
// control, such as the account menu, so the row itself takes no hover fill.
export const sidebarMenuRow = style([
  menuItem,
  {
    selectors: {
      [`${menuItem}&:not([data-disabled]):hover`]: { background: 'none' },
    },
  },
]);
