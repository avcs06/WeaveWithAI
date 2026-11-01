// The design stage's fixed vocabularies and limits.

/** App screens are design-system first; marketing pages are visual first. */
export const SCREEN_KINDS = ['app', 'marketing'] as const;

export const SECTION_KINDS = [
  'hero',
  'page-header',
  'toolbar',
  'filters',
  'list',
  'table',
  'cards',
  'detail',
  'form',
  'stats',
  'empty-state',
  'editor-canvas',
  'side-panel',
  'settings-group',
  'auth-form',
  'feature-grid',
  'cta',
  'footer',
  'custom',
] as const;

export const NODE_ROLES = [
  'heading',
  'text',
  'primary-action',
  'secondary-action',
  'destructive-action',
  'navigation',
  'input',
  'display',
  'feedback',
  'media',
  'container',
  'shape',
] as const;

/**
 * The states a design draws. Loading, a field's error and a
 * submit's progress are the design system's own, and a form's result is a
 * toast, so the design neither draws nor checks them. `error` is a list or a
 * page that fails to load.
 */
export const STATES = ['default', 'empty', 'error', 'denied', 'notFound'] as const;

/**
 * A section's background, each a pair THEME-001 checks: the page (pageFg on
 * pageBg), the frame (pageFg on frameBg), the brand's subtle set (fg on bg)
 * or its fill (accentFg on accentBg).
 */
export const SURFACES = ['page', 'frame', 'brand', 'accent'] as const;

export const NEW_COMPONENT_BUDGET = 5;

/** The spacing key between a dialog's or drawer's widgets; the Dialog pads itself. */
export const DIALOG_GAP = '5';

/** What a widget's outer edge is, for the coding stage: a bordered box, a tinted surface, bare text, or a full-width band. */
export const EDGES = ['bordered', 'surface', 'text', 'band'] as const;

/** A page's content column; `full` is its layout's container. */
export const CONTENT_WIDTHS = ['narrow', 'medium', 'wide', 'full'] as const;

export const CONTENT_WIDTH_PX: Record<(typeof CONTENT_WIDTHS)[number], number> =
  { narrow: 640, medium: 960, wide: 1280, full: 0 };

/** The gap between a page's sections by kind, in px (H-08): the theme sets it, THEME-007 checks it. */
export const SECTION_GAP_PX = {
  app: [24, 32],
  marketing: [24, 48],
} as const;

/** The edges a shell region docks to. */
export const REGION_PLACES = ['top', 'bottom', 'left', 'right'] as const;

/** The Dialog size a dialog or drawer of each content width is; its width and padding come from the inventory. */
export const DIALOG_SIZE = {
  narrow: 'sm',
  medium: 'md',
  wide: 'lg',
  full: 'lg',
} as const;
