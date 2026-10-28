import { tokens } from '@packages/styles/tokens.css';
import { disabledColor, focusRing } from '@packages/styles/utils';
import { createVar, globalStyle, style } from '@vanilla-extract/css';

const colors = tokens.color.base;
const surface = tokens.color.surface;
const transition = '150ms ease';

export const onBg = createVar('switchOnBg');
export const onHoverBg = createVar('switchOnHoverBg');
export const onThumb = createVar('switchOnThumb');
export const offFocus = createVar('switchOffFocus');
export const onFocus = createVar('switchOnFocus');
export const trackWidth = createVar('switchTrackWidth');
export const trackPadding = createVar('switchTrackPadding');
export const thumbSize = createVar('switchThumbSize');

const on = '[data-state="checked"]';
const enabled = ':not([data-disabled])';
const focused = ':is(:focus-visible, :active)';

/** The track; its color scheme sets the on colors and focus rings. */
export const switchTrack = style({
  width: trackWidth,
  padding: trackPadding,
  borderRadius: tokens.radius.full,
  background: surface.skeleton,
  outline: 'none',
  transition: `background-color ${transition}, box-shadow ${transition}`,
  selectors: {
    [`&${enabled}:hover`]: { background: colors.border },
    [`&${enabled}${focused}`]: focusRing(offFocus),
    [`&${on}`]: { background: onBg },
    [`&${on}${enabled}:hover`]: { background: onHoverBg },
    [`&${on}${enabled}${focused}`]: focusRing(onFocus),
    '&[data-disabled]': {
      background: disabledColor(surface.skeleton),
      cursor: 'default',
    },
    [`&${on}[data-disabled]`]: { background: disabledColor(onBg) },
    // Disabled with a reason, it keeps its tab stop: its focus shows, dimmed.
    '&[data-disabled]:focus-visible': focusRing(disabledColor(offFocus)),
    [`&${on}[data-disabled]:focus-visible`]: focusRing(disabledColor(onFocus)),
  },
});

globalStyle(`${switchTrack} > [data-slot='thumb']`, {
  width: thumbSize,
  height: thumbSize,
  borderRadius: tokens.radius.full,
  background: colors.bg,
  boxShadow: tokens.boxShadow.control,
  transition: `transform ${transition}, background-color ${transition}`,
});

globalStyle(`${switchTrack}${on} > [data-slot='thumb']`, {
  transform: `translateX(calc(${trackWidth} - ${thumbSize} - 2 * ${trackPadding}))`,
  background: onThumb,
});

globalStyle(`${switchTrack}[data-disabled] > [data-slot='thumb']`, {
  background: disabledColor(colors.bg),
});

globalStyle(`${switchTrack}${on}[data-disabled] > [data-slot='thumb']`, {
  background: disabledColor(onThumb),
});
