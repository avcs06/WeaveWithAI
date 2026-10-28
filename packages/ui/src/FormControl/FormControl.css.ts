import { tokens } from '@packages/styles/tokens.css';
import { disabledColor, focusRing } from '@packages/styles/utils';
import {
  createVar,
  globalStyle,
  style,
  type StyleRule,
} from '@vanilla-extract/css';

const colors = tokens.color;

const statuses = ['error', 'warning', 'success'] as const;
type Status = (typeof statuses)[number];

/** One `data-status` selector per status, for a style's `selectors`. */
const byStatus = (rule: (status: Status) => StyleRule) =>
  Object.fromEntries(
    statuses.map((status) => [`&[data-status="${status}"]`, rule(status)]),
  );

export const controlBorder = createVar('controlBorder');
export const controlFocus = createVar('controlFocus');
export const controlPaddingY = createVar('controlPaddingY');
export const controlPaddingX = createVar('controlPaddingX');
export const controlLineHeight = createVar('controlLineHeight');
export const controlIconSize = createVar('controlIconSize');

/** The control box; its look draws the border and focus from the vars. */
export const controlBox = style({
  paddingBlock: controlPaddingY,
  paddingInline: controlPaddingX,
  // `size` changes the box, not the font.
  fontSize: tokens.fontSize.body,
  lineHeight: controlLineHeight,
  color: colors.base.fg,
  background: colors.base.bg,
  outline: 'none',
  cursor: 'text',
  selectors: {
    // More specific than the color scheme, so a status wins over `variant`.
    ...byStatus((status) => ({
      vars: {
        [controlBorder]: colors[status].border,
        [controlFocus]: colors[status].focus,
      },
    })),
    '&[data-disabled]': {
      color: colors.base.fgMuted,
      background: colors.base.hoverBg,
      cursor: 'default',
    },
  },
});

globalStyle(`${controlBox} > [data-slot='icon-box'] > [data-slot='icon']`, {
  width: controlIconSize,
  height: controlIconSize,
});

// The control fills the box's padding area so a press anywhere lands in it;
// beside an icon or add-on, the box's gap is the only space.
globalStyle(`${controlBox} > [data-slot='control']`, {
  marginBlock: `calc(-1 * ${controlPaddingY})`,
  marginInline: `calc(-1 * ${controlPaddingX})`,
  paddingBlock: controlPaddingY,
  paddingInline: controlPaddingX,
  border: 'none',
  font: 'inherit',
  color: 'inherit',
  background: 'transparent',
  outline: 'none',
  cursor: 'inherit',
});

globalStyle(`${controlBox}[data-left] > [data-slot='control']`, {
  marginLeft: 0,
  paddingLeft: 0,
});

globalStyle(`${controlBox}[data-right] > [data-slot='control']`, {
  marginRight: 0,
  paddingRight: 0,
});

globalStyle(`${controlBox} > [data-slot='control']::placeholder`, {
  color: colors.base.fgMuted,
  opacity: 1,
});

export const controlLabel = style({
  fontSize: tokens.fontSize.label,
  fontWeight: tokens.fontWeight.medium,
  lineHeight: tokens.lineHeight[4],
  color: colors.base.fgMuted,
});

export const requiredMark = style({
  top: `-${tokens.spacing[0.5]}`,
  color: colors.base.fg,
});

export const hintButton = style({
  border: 'none',
  borderRadius: tokens.radius.full,
  color: colors.base.fgMuted,
  background: 'transparent',
  outline: 'none',
  selectors: {
    '&:is(:focus-visible, :active)': focusRing(colors.focus),
  },
});

globalStyle(`${hintButton} > [data-slot='icon']`, {
  width: tokens.iconSize.label,
  height: tokens.iconSize.label,
});

/**
 * A checkbox or radio with its label to the right: body text, 6px from the box;
 * pressing it toggles the box.
 */
export const controlChoice = style({});

globalStyle(`${controlChoice} > [data-slot='label-row']`, {
  minWidth: 0,
  paddingInline: 0,
});

globalStyle(`${controlChoice} label`, {
  fontSize: tokens.fontSize.body,
  fontWeight: tokens.fontWeight.regular,
  lineHeight: tokens.lineHeight[4.5],
  color: colors.base.fg,
  userSelect: 'none',
  cursor: 'pointer',
});

globalStyle(`${controlChoice}[data-disabled] label`, {
  cursor: 'default',
});

// Disabled, the label dims with the box; read-only, it stays readable.
globalStyle(
  `${controlChoice}[data-disabled]:not([data-readonly]) :is(label, ${requiredMark})`,
  { color: disabledColor(colors.base.fg) },
);

/** Help text and the status message. */
export const controlMessage = style({
  paddingInline: tokens.spacing[1],
  fontSize: tokens.fontSize.caption,
  fontWeight: tokens.fontWeight.medium,
  lineHeight: tokens.lineHeight[4],
  color: colors.base.fgMuted,
  selectors: {
    ...byStatus((status) => ({ color: colors[status].fgMuted })),
    // The message's live region stays on the page while empty so a new message
    // is announced; out of the flow, it adds no gap.
    '&:empty': { position: 'absolute' },
  },
});

globalStyle(`${controlMessage} a`, {
  color: colors.base.fg,
});

for (const status of statuses) {
  globalStyle(`${controlMessage}[data-status="${status}"] a`, {
    color: colors[status].fg,
  });
}
