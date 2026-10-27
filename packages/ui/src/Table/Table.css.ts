import { tokens } from '@packages/styles/tokens.css';
import { globalStyle, style } from '@vanilla-extract/css';

const colors = tokens.color;
const divider = `1px solid ${colors.base.divider}`;
// The table's outline, around the header and body; rows keep `divider`.
const outline = `1px solid ${colors.base.border}`;
// The panel radius, as on Card and Dialog.
const radius = tokens.radius.surface;

// Its own stacking context: the body's z-index (over the header's edge) stays
// inside the table, below portalled popovers.
export const root = style({
  isolation: 'isolate',
  fontFamily: tokens.fontFamily.ui,
  fontSize: tokens.fontSize.body,
  lineHeight: tokens.lineHeight.body,
  color: colors.base.fg,
});

// Rounded on top; its bottom runs `radius` under the body, so its sides meet
// the body's sides where they turn straight. The body's top border is the
// line under the header.
//
// Radix scrollbars overlay content. While the body scrolls vertically, the
// header leaves the same room as the body, so their columns stay aligned.
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
  width: '100%',
  tableLayout: 'fixed',
  borderCollapse: 'separate',
  borderSpacing: 0,
});

export const body = style({
  selectors: {
    '&[data-dragging="true"]': { position: 'relative', zIndex: 1 },
  },
});

// Hover is for data rows (slot "row"): header, expanded content, spacer and
// message rows carry other slots and stay flat.
export const row = style({
  selectors: {
    [`${body} > &[data-slot="row"]:hover, &[data-selected="true"]`]: {
      background: colors.base.hoverBg,
    },
    '&[data-clickable="true"]': { cursor: 'pointer' },
  },
});

// Content never draws into a neighboring column (an auto column can collapse
// to zero width); the margin keeps edge focus rings visible.
const clipToCell = {
  overflow: 'clip',
  overflowClipMargin: tokens.spacing[1],
} as const;

// 6px per side → 12px between columns, 6px at the outer edges. The block
// padding fits a 4px focus ring, which the header's viewport would clip.
export const columnHeaderCell = style({
  ...clipToCell,
  paddingBlock: tokens.spacing[1],
  paddingInline: tokens.spacing[1.5],
  background: colors.base.bg,
  fontWeight: tokens.fontWeight.medium,
  verticalAlign: 'middle',
});

export const cell = style({
  ...clipToCell,
  // A row header is a `th`, which is bold by default.
  fontWeight: 'inherit',
  paddingBlock: tokens.spacing[2],
  paddingInline: tokens.spacing[1.5],
  borderBottom: divider,
  verticalAlign: 'middle',
  selectors: {
    [`${body}[data-dragging="true"] &`]: {
      background: colors.base.bg,
      boxShadow: tokens.boxShadow.dropdown,
    },
  },
});

// After `cell`, so it wins: stands in for unrendered rows, no padding or line.
export const spacerCell = style({
  padding: 0,
  borderBottom: 'none',
});

// The body's scroll area: rounded on every corner, drawn over the header's
// lower edge. It's a Radix root without a class of ours, hence the global.
globalStyle(`${root} [data-slot="table-body"]`, {
  border: outline,
  borderRadius: radius,
  background: colors.base.bg,
  zIndex: 1,
});
