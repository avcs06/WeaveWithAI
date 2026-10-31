import { readFileSync } from 'node:fs';
import { pathBeside } from '../../../core/utils';

export type FontFamily = {
  /** The family as Google names it: `Playfair Display`. */
  name: string;
  /** The `next/font/google` export: `Playfair_Display`. */
  googleName: string;
  /** The weights it ships, `400` to `900`. */
  weights: string[];
  /** A variable font takes `weight: 'variable'` and any weight in range. */
  variable: boolean;
  /** Has a latin subset, so it can set a UI in English. */
  latin: boolean;
  /** Google's category: sans-serif, serif, display, handwriting, monospace. */
  category?: string;
  /** The one use it suits best: ui for text, display for headings, mono for code. */
  use: 'ui' | 'display' | 'mono';
  /** Google's popularity rank, 1 is the most used. */
  popularity?: number;
  /** One sentence for the brief: style, feel, what it suits. */
  description?: string;
};

/**
 * The families `next/font/google` exports with a latin subset and a Google
 * popularity under 120, most popular first. Made once on 2026-10-30.
 */
export const GOOGLE_FONTS: readonly FontFamily[] = JSON.parse(
  readFileSync(pathBeside(import.meta.url, './google-fonts.json'), 'utf8'),
) as FontFamily[];

const byKey = new Map(
  GOOGLE_FONTS.flatMap((family) => [
    [family.name.toLowerCase(), family],
    [family.googleName.toLowerCase(), family],
  ]),
);

/** A family by its name or its export name, in any case; undefined when the catalog has none. */
export const googleFont = (name: string): FontFamily | undefined =>
  byKey.get(name.trim().toLowerCase());

/** The weights the design system uses, where a family has them. */
export const TEXT_WEIGHTS = ['400', '500', '600', '700'] as const;

const namesFor = (use: FontFamily['use']): [string, ...string[]] => {
  const [first, ...rest] = GOOGLE_FONTS.filter((family) => family.use === use).map(
    (family) => family.name,
  );
  if (first === undefined) throw new Error(`the font catalog has no ${use} family`);
  return [first, ...rest];
};

/** Fonts a brief may pick for UI text. */
export const UI_FONTS = namesFor('ui');

/** Fonts a brief may pick for headings. */
export const DISPLAY_FONTS = namesFor('display');

/** Fonts a brief may pick for code. */
export const MONO_FONTS = namesFor('mono');
