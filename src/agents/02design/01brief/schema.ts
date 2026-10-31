import { z } from 'zod';
import { DISPLAY_FONTS, MONO_FONTS, UI_FONTS } from './fonts';

/** How tinted a surface is; the brand color itself is never neutral. */
const SURFACE_CHROMA = ['neutral', 'muted', 'balanced', 'vivid'] as const;

/** How tinted the base set is; it carries most components, so never vivid. */
const BASE_CHROMA = ['neutral', 'muted', 'balanced'] as const;

/**
 * The design direction the brief call picks, once per app; the theme call
 * turns it into exact values.
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
  pageHue: z
    .number()
    .describe('Hue of the page background, OKLCH degrees, 0 to 360'),
  pageChroma: z
    .enum(SURFACE_CHROMA)
    .describe(
      'neutral is white or grey with no tint, muted a faint tint, balanced and vivid a clear color',
    ),
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
  fonts: z.object({
    ui: z.enum(UI_FONTS),
    display: z.enum(DISPLAY_FONTS),
    mono: z.enum(MONO_FONTS),
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
