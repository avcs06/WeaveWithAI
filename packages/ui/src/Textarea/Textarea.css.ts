import { style } from '@vanilla-extract/css';

// eslint-disable-next-line import-rules/barrel-only-sibling-imports -- the box's spacing, for a control that sizes itself in it.
import {
  controlLineHeight,
  controlPaddingY,
} from '../FormControl/FormControl.css';

export const textarea = style({
  // Dragged wider, it would push past its column.
  resize: 'vertical',
  // Dragged shorter, it stops at one line: the box's own height.
  minHeight: `calc(${controlLineHeight} + 2 * ${controlPaddingY})`,
});
