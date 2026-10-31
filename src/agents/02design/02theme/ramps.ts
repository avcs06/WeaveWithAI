import { clampChroma, formatHex, wcagContrast } from 'culori';
import type { Brief } from '../01brief/schema';
import { entitySets, type Mode, modesOf } from './schema';

// The theme call picks colors from ramps code computes from the brief's hues
// (DS27, D3.3 E notes): a model cannot work out contrast, and writing hex it
// falls back to palettes it knows.

/** OKLCH lightness of each step: backgrounds first, then borders, solid fills, and text last. */
const LIGHTNESS: Record<Mode, number[]> = {
  light: [0.985, 0.96, 0.93, 0.89, 0.85, 0.79, 0.71, 0.62, 0.52, 0.46, 0.38, 0.23],
  dark: [0.17, 0.2, 0.25, 0.29, 0.33, 0.38, 0.45, 0.54, 0.66, 0.71, 0.82, 0.95],
};
/** Chroma at full strength, by the brief's level; neutral is grey whatever the hue. */
const CHROMA = { neutral: 0, muted: 0.06, balanced: 0.12, vivid: 0.17 };
export type ChromaLevel = keyof typeof CHROMA;
/** Each step's share of it: backgrounds a little of the hue, solid fills all of it, text less. */
const SHARE = [0.15, 0.25, 0.35, 0.45, 0.55, 0.6, 0.7, 0.85, 1, 1, 0.8, 0.5];

/** Twelve hex colors of one hue and chroma, in sRGB, in capitals. */
export function ramp(hue: number, chroma: ChromaLevel, mode: Mode): string[] {
  return LIGHTNESS[mode].map((l, i) =>
    formatHex(
      clampChroma(
        { mode: 'oklch', l, c: CHROMA[chroma] * (SHARE[i] ?? 1), h: hue },
        'oklch',
      ),
    ).toUpperCase(),
  );
}

/** One mode's ramps: the brand's (`theme`), the base set's, the frame's and each colored entity's. The page's own background is the brief's CSS. */
export type ModeRamps = {
  theme: string[];
  base: string[];
  frame: string[];
  entity: Record<string, string[]>;
};
export type Ramps = Partial<Record<Mode, ModeRamps>>;

/** The ramps of every hue and chroma the brief names, in each of its modes. Entities take the brand's chroma. */
export function rampsOf(brief: Brief): Ramps {
  return Object.fromEntries(
    modesOf(brief).map((mode) => [
      mode,
      {
        theme: ramp(brief.seedHue, brief.seedChroma, mode),
        base: ramp(brief.baseHue, brief.baseChroma, mode),
        frame: ramp(brief.frameHue, brief.frameChroma, mode),
        entity: Object.fromEntries(
          entitySets(brief).map(({ name, hue }) => [
            name,
            ramp(hue, brief.seedChroma, mode),
          ]),
        ),
      },
    ]),
  );
}

/** The ramps for the prompt: per mode and ramp, each step's color and its contrast on white and on black. */
export function rampTable(ramps: Ramps): string {
  const two = (n: number) => n.toFixed(2);
  const block = (title: string, hexes: string[]) =>
    [
      `${title}:`,
      ...hexes.map(
        (hex, i) =>
          `${i + 1} ${hex} on white ${two(wcagContrast(hex, '#FFFFFF'))}, on black ${two(wcagContrast(hex, '#000000'))}`,
      ),
    ].join('\n');
  return Object.entries(ramps)
    .flatMap(([mode, sets]) =>
      sets
        ? [
            block(`${mode} mode, theme`, sets.theme),
            block(`${mode} mode, base`, sets.base),
            block(`${mode} mode, frame`, sets.frame),
            ...Object.entries(sets.entity).map(([name, hexes]) =>
              block(`${mode} mode, entity ${name}`, hexes),
            ),
          ]
        : [],
    )
    .join('\n\n');
}
