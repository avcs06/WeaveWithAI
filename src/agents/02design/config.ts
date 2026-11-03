// The design stages' fixed limits.

/** The gap between a page's sections by kind, in px: fixed by PageLayout. THEME-007 keeps the page padding at least this wide. */
export const SECTION_GAP_PX = { app: 24, marketing: 36 } as const;

/** A header's padding in px: fixed by PageLayout. THEME-007 keeps the gap between its items at most the horizontal padding. */
export const HEADER_PADDING_PX = { horizontal: 16, vertical: 12 } as const;

/** Where in a header or footer an item sits: the slot that names it. */
export type BarPosition = 'start' | 'center' | 'end';

/** The words a layout's slot names the logo and the account by; code places them there. */
export const LOGO = /\b(logo|wordmark)\b/i;
export const ACCOUNT = /\baccount\b/i;

/** The bar's slot that names it. */
export const positionIn = (bar: Record<BarPosition, string>, name: RegExp): BarPosition | undefined =>
  (['start', 'center', 'end'] as const).find((position) => name.test(bar[position]));
