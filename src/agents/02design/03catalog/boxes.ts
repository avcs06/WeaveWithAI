import type { SECTION_KINDS } from '../config';

// The table of possible boxes (DS23, DR11): the catalog sets each widget's
// width range and each part's minimum from it, so no width is a guess. The
// part minimums follow the layout heuristics (H-26: a field 160, a card 240).

type Kind = (typeof SECTION_KINDS)[number];

/** A widget kind's usual width range in px; a max of 0 fills what it is given. */
export const WIDGET_WIDTHS: Record<Kind, { min: number; max: number }> = {
  hero: { min: 640, max: 0 },
  'page-header': { min: 480, max: 0 },
  toolbar: { min: 480, max: 0 },
  filters: { min: 480, max: 0 },
  list: { min: 480, max: 0 },
  table: { min: 640, max: 0 },
  cards: { min: 480, max: 0 },
  detail: { min: 480, max: 960 },
  form: { min: 320, max: 640 },
  stats: { min: 480, max: 0 },
  'empty-state': { min: 320, max: 640 },
  'editor-canvas': { min: 640, max: 0 },
  'side-panel': { min: 240, max: 360 },
  'settings-group': { min: 480, max: 960 },
  'auth-form': { min: 320, max: 480 },
  'feature-grid': { min: 640, max: 0 },
  cta: { min: 480, max: 0 },
  footer: { min: 480, max: 0 },
  custom: { min: 240, max: 0 },
};

/** A part's usual minimum width in px. */
export const PART_WIDTHS = {
  field: 160,
  card: 240,
  button: 80,
  'icon button': 32,
  checkbox: 20,
  avatar: 32,
  chip: 64,
  tag: 64,
  date: 96,
  number: 64,
  'short text': 80,
  'title text': 160,
  'body text': 240,
  image: 160,
} as const;
