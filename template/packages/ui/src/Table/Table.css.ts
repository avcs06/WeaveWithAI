import { tokens } from '@packages/styles/tokens.css';
import { globalStyle, style } from '@vanilla-extract/css';

const colors = tokens.color;
const divider = `1px solid ${colors.surface.divider}`;
// Outline around header and body; rows keep `divider`.
const outline = `1px solid ${colors.base.border}`;
// Panel radius, as on Card and Dialog.
const radius = tokens.radius.surface;

// Own stacking context: the body's z-index (over the header's edge) stays below
// portalled popovers.
export const root = style({
  fontFamily: tokens.fontFamily.ui,
  fontSize: tokens.fontSize.body,
  lineHeight: tokens.lineHeight.body,
  color: colors.base.fg,
});

// Rounded on top; its bottom runs `radius` under the body so the sides meet
// where they turn straight. The body's top border is the line under the header.
//
// Radix scrollbars overlay content: while the body scrolls vertically, the
// header leaves the same room, so columns align.
export const headerViewport = style({
  border: outline,
  borderBottom: 'none',
  borderTopLeftRadius: radius,
  borderTopRightRadius: radius,
  background: colors.base.bg,
  paddingBottom: radius,
  marginBottom: `calc(${radius} * -1)`,
  selectors: {
    '[role="table"]:has(> [data-slot="table-body"] > [data-orientation="vertical"]) > &':
      { paddingRight: tokens.spacing[3.5] },
  },
});

export const table = style({
  tableLayout: 'fixed',
  borderCollapse: 'separate',
  borderSpacing: 0,
});

export const body = style({
  selectors: {
    '&[data-dragging="true"]': { position: 'relative', zIndex: 1 },
  },
});

// Hover only on data rows (slot "row"); header, expanded, spacer and message
// rows stay flat.
export const row = style({
  selectors: {
    [`${body} > &[data-slot="row"]:hover, &[data-selected="true"]`]: {
      background: colors.base.hoverBg,
    },
    '&[data-clickable="true"]': { cursor: 'pointer' },
  },
});

// Clips content to its column (an auto column can collapse to zero width); the
// margin keeps edge focus rings visible.
const clipToCell = {
  overflow: 'clip',
  overflowClipMargin: tokens.spacing[1],
} as const;

// 6px per side: 12px between columns, 6px at the edges. Block padding fits a
// 4px focus ring the header's viewport would clip.
export const columnHeaderCell = style({
  ...clipToCell,
  paddingBlock: tokens.spacing[1],
  paddingInline: tokens.spacing[1.5],
  background: colors.base.bg,
  fontWeight: tokens.fontWeight.medium,
});

export const cell = style({
  ...clipToCell,
  // A row header is a `th`, which is bold by default.
  fontWeight: 'inherit',
  paddingBlock: tokens.spacing[2],
  paddingInline: tokens.spacing[1.5],
  borderBottom: divider,
  selectors: {
    [`${body}[data-dragging="true"] &`]: {
      background: colors.base.bg,
      boxShadow: tokens.boxShadow.dropdown,
    },
  },
});

// Over `cell`: stands in for unrendered rows, no padding or line.
export const spacerCell = style({
  selectors: {
    '&&': {
      padding: 0,
      borderBottom: 'none',
    },
  },
});

// Body scroll area: rounded, drawn over the header's lower edge. A Radix root
// without our class, hence the global.
globalStyle(`${root} [data-slot="table-body"]`, {
  border: outline,
  borderRadius: radius,
  background: colors.base.bg,
  zIndex: 1,
});
