// The design stage's fixed vocabularies and limits (specs/design.md, D3.5).

export const SCREEN_TEMPLATES = [
  'landing',
  'auth',
  'list',
  'detail',
  'form',
  'dashboard',
  'editor',
  'settings',
] as const;

/** Design-system first; the others, the public pages, are visual first (D3.1 notes). */
export const INNER_TEMPLATES = [
  'auth',
  'list',
  'detail',
  'form',
  'dashboard',
  'editor',
  'settings',
] as const;

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

export const NEW_COMPONENT_BUDGET = 5;

/** A page's content column; `full` is the viewport. */
export const CONTENT_WIDTHS = ['narrow', 'medium', 'wide', 'full'] as const;
export const CONTENT_WIDTH_PX: Record<(typeof CONTENT_WIDTHS)[number], number> =
  { narrow: 640, medium: 960, wide: 1280, full: 0 };

/** The viewports the layout skeleton is solved at. */
export const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  phone: { width: 375, height: 700 },
} as const;
