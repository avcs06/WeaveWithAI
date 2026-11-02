// The design stage's fixed vocabularies and limits.

/** The gap between a page's sections by kind, in px: the theme sets it, THEME-007 checks it. */
export const SECTION_GAP_PX = {
  app: [24, 32],
  marketing: [24, 48],
} as const;

/** The edges a shell region docks to. */
export const REGION_PLACES = ['top', 'bottom', 'left', 'right'] as const;
