import { tokens } from '@packages/styles/tokens.css';
import { style } from '@vanilla-extract/css';

// eslint-disable-next-line import-rules/barrel-only-sibling-imports -- the vars a surface built on Menu sets.
import {
  menuListPaddingBlock,
  menuShadow,
  menuShellPaddingBlock,
} from '../Menu/Menu.css';

// A popover's content is a panel, not rows: its top and bottom padding sits
// inside the scroll area, so a field's focus ring at either edge is not
// clipped by the viewport.
export const popover = style({
  vars: {
    [menuShadow]: tokens.boxShadow.popover,
    [menuShellPaddingBlock]: '0px',
    [menuListPaddingBlock]: tokens.spacing[2],
  },
});
