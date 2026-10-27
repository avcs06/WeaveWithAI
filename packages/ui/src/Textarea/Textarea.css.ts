import { tokens } from '@packages/styles/tokens.css';
import { style } from '@vanilla-extract/css';

// eslint-disable-next-line import-rules/barrel-only-sibling-imports -- the box's spacing, for a control that sizes itself in it.
import {
  controlBox,
  controlLineHeight,
  controlPaddingY,
} from '../FormControl/FormControl.css';

// The box's line height is a one-line control's; lines of text keep `sm`'s
// at every size.
const textLineHeight = tokens.lineHeight[6];

export const textarea = style({
  // Dragged wider, it would push past its column.
  resize: 'vertical',
  // Dragged shorter, it stops at one line: the box's own height.
  minHeight: `calc(${controlLineHeight} + 2 * ${controlPaddingY})`,
  selectors: {
    // As specific as the box's rule for its control, and after it.
    [`${controlBox} > &`]: {
      lineHeight: textLineHeight,
      // The first line stays centered where the box's line would be, level
      // with the icons.
      paddingBlock: `calc(${controlPaddingY} + (${controlLineHeight} - ${textLineHeight}) / 2)`,
    },
  },
});
