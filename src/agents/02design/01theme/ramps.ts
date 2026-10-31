import { clampChroma, formatHex, wcagContrast } from 'culori';
import { type Status, STATUSES } from './brief';
import { type Brief, entitySets, type Mode, modesOf } from './schema';

// The theme call picks colors from ramps code computes from the brief's hues
// (DS27, D3.3 F notes): a model cannot work out contrast, and writing hex it
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

/** One mode's ramps: the brand's (`theme`), the base set's, the frame's, each colored entity's and each status's. The page's own background is CSS. */
export type ModeRamps = {
  theme: string[];
  base: string[];
  frame: string[];
  entity: Record<string, string[]>;
  status: Record<Status, string[]>;
};
export type Ramps = Partial<Record<Mode, ModeRamps>>;

/** A status ramp's chroma: the brand's, at least balanced, so a quiet brand keeps statuses that read as their meaning (user, 2026-10-31). */
const statusChroma = (brief: Brief): ChromaLevel => (brief.seedChroma === 'vivid' ? 'vivid' : 'balanced');

/** The ramps of every hue and chroma the brief names, in each of its modes. Entities take the brand's chroma, statuses at least balanced. */
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
        status: Object.fromEntries(
          STATUSES.map((status) => [status, ramp(brief.statusHues[status], statusChroma(brief), mode)]),
        ) as Record<Status, string[]>,
      },
    ]),
  );
}

/**
 * How code makes a ramp, and which steps read on which, for the prompt: the
 * hues come in the same answer, so no ramp exists to show (D3.3 F). Contrast
 * follows lightness, so the table is each pair's worst case over every hue and
 * chroma, and holds for any two ramps (user, 2026-11-01).
 */
export function stepGuide(): string {
  const levels = Object.entries(CHROMA).map(([level, c]) => `${level} ${c}`).join(', ');
  const list = (values: number[]) => values.map((v, i) => `${i + 1}: ${v}`).join(', ');
  const ranges = (steps: number[]) =>
    steps.length === 0
      ? 'no step'
      : `${steps.length === 1 ? 'step' : 'steps'} ${steps
          .reduce<number[][]>((runs, s) => {
            const last = runs.at(-1);
            if (last && last.at(-1) === s - 1) last.push(s);
            else runs.push([s]);
            return runs;
          }, [])
          .map((run) => (run.length > 1 ? `${run[0]} to ${run.at(-1)}` : `${run[0]}`))
          .join(', ')}`;
  const table = (mode: Mode) => {
    // Each step's lightest and darkest luminance, over every hue and chroma.
    const luminance = (hex: string) => (wcagContrast(hex, '#000000') - 1) * 0.05;
    const ramps = (Object.keys(CHROMA) as ChromaLevel[]).flatMap((level) =>
      Array.from({ length: 72 }, (_, h) => ramp(h * 5, level, mode).map(luminance)),
    );
    const span = LIGHTNESS[mode].map((_, i) => {
      const ys = ramps.map((r) => r[i] ?? 0);
      return { low: Math.min(...ys), high: Math.max(...ys) };
    });
    const worst = (a: number, b: number) => {
      const [x, y] = [span[a]!, span[b]!];
      return x.low > y.high ? (x.low + 0.05) / (y.high + 0.05) : (y.low + 0.05) / (x.high + 0.05);
    };
    return span
      .map((_, bg) => {
        const reads = (min: number) => span.map((__, fg) => fg).filter((fg) => fg !== bg && worst(fg, bg) >= min).map((fg) => fg + 1);
        return `- On step ${bg + 1}: text (4.5:1) ${ranges(reads(4.5))}; borders, focus and the logo (3:1) ${ranges(reads(3))}.`;
      })
      .join('\n');
  };
  return [
    'Step n of a ramp is the OKLCH color of lightness L(n), chroma C times share(n), and the ramp\'s hue.',
    `- L in light mode: ${list(LIGHTNESS.light)}.`,
    `- L in dark mode: ${list(LIGHTNESS.dark)}.`,
    `- share: ${list(SHARE)}.`,
    `- C by chroma: ${levels}. Entity ramps take the brand's chroma, status ramps the brand's but at least balanced.`,
    '',
    'Contrast follows lightness, so which steps read on which holds for every hue and chroma. In light mode:',
    table('light'),
    '',
    'In dark mode:',
    table('dark'),
  ].join('\n');
}
