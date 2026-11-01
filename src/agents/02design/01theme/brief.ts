import { z } from 'zod';
import { DISPLAY_FONTS, MONO_FONTS, UI_FONTS } from './fonts';

/** How tinted a surface is; the brand color itself is never neutral. */
const SURFACE_CHROMA = ['neutral', 'muted', 'balanced', 'vivid'] as const;

/** How tinted the base set is; it carries most components, so never vivid. */
const BASE_CHROMA = ['neutral', 'muted', 'balanced'] as const;

/** The status colors, each a set of the theme's own. */
export const STATUSES = ['success', 'warning', 'error', 'info'] as const;
export type Status = (typeof STATUSES)[number];

/** Each status's hue band, OKLCH degrees: inside it the color reads as its meaning. */
export const STATUS_BANDS: Record<Status, [number, number]> = {
  success: [135, 180],
  warning: [65, 100],
  error: [0, 45],
  info: [220, 270],
};

/** A role's font candidates, best first; a model favors the top of a list, so it names three and says why. */
const candidates = <T extends readonly [string, ...string[]]>(names: T) =>
  z
    .array(z.object({ family: z.enum(names), reason: z.string() }))
    .describe('Three families, best first, each with why it suits the brief');

/**
 * The design direction, the first part of the theme call's answer:
 * the later stages read it beside the theme its values became.
 */
export const Brief = z.object({
  audience: z.string(),
  personality: z
    .array(z.string())
    .describe('3 to 5 adjectives for the look and feel'),
  voice: z
    .string()
    .describe('Tone of the copy, e.g. "plain, warm, second person"'),
  density: z.enum(['compact', 'comfortable', 'spacious']),
  feel: z
    .array(z.string())
    .describe("1 or 2 words for the site's style, e.g. minimal, retro"),
  colorScheme: z.enum(['light', 'dark', 'both']),
  seedHue: z
    .number()
    .describe('Brand hue as a number of degrees on the color wheel, 0 to 360'),
  seedChroma: z.enum(['muted', 'balanced', 'vivid']),
  frameHue: z
    .number()
    .describe(
      'Hue of the header, sidebars and footer, OKLCH degrees, 0 to 360',
    ),
  frameChroma: z.enum(SURFACE_CHROMA),
  baseHue: z
    .number()
    .describe(
      'Hue of the base set most components use (secondary buttons, inputs, cards, tables, menus), OKLCH degrees, 0 to 360',
    ),
  baseChroma: z
    .enum(BASE_CHROMA)
    .describe(
      'neutral is grey with no tint, muted a faint tint, balanced a clear one',
    ),
  statusHues: z
    .object(Object.fromEntries(STATUSES.map((status) => [status, z.number()])) as Record<Status, z.ZodNumber>)
    .describe(
      `OKLCH hues of the status colors, each inside its band: ${STATUSES.map((s) => `${s} ${STATUS_BANDS[s][0]} to ${STATUS_BANDS[s][1]}`).join(', ')}`,
    ),
  fonts: z.object({
    ui: candidates(UI_FONTS),
    display: candidates(DISPLAY_FONTS),
    mono: candidates(MONO_FONTS),
  }),
  radius: z.enum(['sharp', 'soft', 'round', 'pill']),
  focusRing: z.enum(['halo', 'offset', 'glow']),
  entities: z
    .array(
      z.object({
        noun: z.string().describe('A noun from the scope vocabulary'),
        colored: z
          .boolean()
          .describe('True when users must tell its records apart at a glance'),
        hue: z.number().describe('Degrees, 0 to 360, when colored; 0 if not'),
      }),
    )
    .describe('Every noun of the scope vocabulary once; at most 3 colored'),
  imagery: z.enum(['none', 'icons', 'illustrations']),
  references: z
    .array(z.string())
    .describe('Style references named in the idea; []'),
});

export type Brief = z.infer<typeof Brief>;

/** The family the app uses for each role: the first candidate, or the list's first when a brief has none. */
export const chosenFonts = (brief: Brief) => ({
  ui: brief.fonts.ui[0]?.family ?? UI_FONTS[0],
  display: brief.fonts.display[0]?.family ?? DISPLAY_FONTS[0],
  mono: brief.fonts.mono[0]?.family ?? MONO_FONTS[0],
});
