// The design stage's fixed vocabularies and limits (specs/design.md, D3.5).

/** App screens are design-system first; marketing pages are visual first (D3.1 notes). */
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
] as const;

export const STATES = [
  'default',
  'loading',
  'empty',
  'error',
  'success',
  'invalid',
  'submitting',
  'denied',
  'notFound',
] as const;

/**
 * A section's background, each a pair THEME-001 checks: the page (pageFg on
 * pageBg), the frame (pageFg on frameBg), the brand's subtle set (fg on bg)
 * or its fill (accentFg on accentBg).
 */
export const SURFACES = ['page', 'frame', 'brand', 'accent'] as const;

export const NEW_COMPONENT_BUDGET = 5;

/** How a screen arranges its widgets: stacked, or one main widget beside one side panel (DS23). */
export const ARRANGEMENTS = ['column', 'main-side'] as const;

/** Where a placed widget sits on a `main-side` screen; `column` screens use `main` only. */
export const AREAS = ['main', 'side'] as const;

/** The width of a side panel, in px. */
export const SIDE_WIDTH_PX = 300;

/** The spacing key between a dialog's or drawer's widgets; the Dialog pads itself. */
export const DIALOG_GAP = '5';

/** What a widget's outer edge is, for the coding stage: a bordered box, a tinted surface, bare text, or a full-width band. */
export const EDGES = ['bordered', 'surface', 'text', 'band'] as const;

/** What a copy deck string is for. */
export const COPY_KINDS = [
  'title',
  'heading',
  'text',
  'action',
  'navigation',
  'field',
  'placeholder',
  'empty',
  'error',
  'success',
  'label',
] as const;

/** A page's content column; `full` is its layout's container. */
export const CONTENT_WIDTHS = ['narrow', 'medium', 'wide', 'full'] as const;

export const CONTENT_WIDTH_PX: Record<(typeof CONTENT_WIDTHS)[number], number> =
  { narrow: 640, medium: 960, wide: 1280, full: 0 };

/** The gap between a page's sections by kind, in px (H-08): the theme sets it, LAYOUT-008 measures it. */
export const SECTION_GAP_PX = {
  app: [24, 32],
  marketing: [24, 48],
} as const;

/** The edges a shell region docks to (D3.5 B). */
export const REGION_PLACES = ['top', 'bottom', 'left', 'right'] as const;

/** The Dialog size a dialog or drawer of each content width is; its width and padding come from the inventory. */
export const DIALOG_SIZE = {
  narrow: 'sm',
  medium: 'md',
  wide: 'lg',
  full: 'lg',
} as const;
