import { describe, expect, it } from 'vitest';
import {
  DISPLAY_FONTS,
  GOOGLE_FONTS,
  googleFont,
  MONO_FONTS,
  UI_FONTS,
} from './fonts';

describe('Google Fonts catalog', () => {
  it('holds the latin families with popularity under 120, most popular first, with their weights', () => {
    expect(GOOGLE_FONTS).toHaveLength(193);
    expect(GOOGLE_FONTS.every((family) => family.latin)).toBe(true);
    expect(GOOGLE_FONTS[0]?.name).toBe('Inter');
    const ranks = GOOGLE_FONTS.map((family) => family.popularity ?? Infinity);
    expect(ranks.every((rank) => rank < 120)).toBe(true);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    expect(googleFont('Inter')).toMatchObject({
      googleName: 'Inter',
      variable: true,
      latin: true,
      weights: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
    });
    expect(googleFont('Anton')).toMatchObject({ weights: ['400'], variable: false });
  });

  it('finds a family by its name or its export name, in any case', () => {
    expect(googleFont('Playfair Display')?.googleName).toBe('Playfair_Display');
    expect(googleFont('playfair_display')?.name).toBe('Playfair Display');
    expect(googleFont('Comic Sans')).toBeUndefined();
  });

  it('carries a category, a popularity rank and a one-line description', () => {
    const inter = googleFont('Inter');
    expect(inter?.category).toBe('sans-serif');
    expect(inter?.popularity).toBeLessThan(10);
    expect(inter?.description?.split(' ').length).toBeLessThanOrEqual(20);
    expect(GOOGLE_FONTS.every((f) => f.description && f.category)).toBe(true);
  });

  it('gives every family one use and derives the UI, display and mono lists from it', () => {
    const uses = GOOGLE_FONTS.map((family) => family.use);
    expect(new Set(uses)).toEqual(new Set(['ui', 'display', 'mono']));
    expect(googleFont('Inter')?.use).toBe('ui');
    expect(googleFont('Playfair Display')?.use).toBe('display');
    expect(googleFont('JetBrains Mono')?.use).toBe('mono');
    expect(UI_FONTS).toEqual(expect.arrayContaining(['Inter', 'Lora', 'Plus Jakarta Sans']));
    expect(DISPLAY_FONTS).toEqual(expect.arrayContaining(['Fraunces', 'Lobster', 'Oswald']));
    expect(MONO_FONTS).toEqual(expect.arrayContaining(['JetBrains Mono', 'Roboto Mono']));
    // Each family is in exactly one list.
    expect(new Set([...UI_FONTS, ...DISPLAY_FONTS, ...MONO_FONTS]).size).toBe(GOOGLE_FONTS.length);
    expect(UI_FONTS.length + DISPLAY_FONTS.length + MONO_FONTS.length).toBe(GOOGLE_FONTS.length);
  });
});
