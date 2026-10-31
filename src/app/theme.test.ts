import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Brief } from '../stages/design/schema';
import { buildTheme, type Theme } from '../stages/design/theme';
import type { ThemeCall } from '../stages/design/schema-theme';
import {
  applyColors,
  applyRecipeDefaults,
  applyTokens,
  fontsModule,
  previewHead,
  variantValues,
} from './theme';

// The template's own files, read only; the theme is the reading-list fixture.
const template = (file: string) => readFileSync(`template/${file}`, 'utf8');
const fixture = (name: string) =>
  JSON.parse(readFileSync(`src/stages/design/__fixtures__/reading-list.${name}.json`, 'utf8')) as unknown;
const theme: Theme = buildTheme(Brief.parse(fixture('brief')), fixture('theme') as ThemeCall);

describe('applyColors', () => {
  const before = template('colors.ts');
  const after = applyColors(before, theme);

  it('writes the brand and base sets and the page colors in each mode, and leaves status alone', () => {
    const light = theme.colors.light!;
    expect(after).toContain(`accentBg: '${light.theme.accentBg}'`);
    expect(after).toContain(`pageBg: '${light.page.pageBg}'`);
    expect(after).toContain(`frameBg: '${theme.colors.dark!.page.frameBg}'`);
    const base = (text: string) => text.slice(text.indexOf('base: {'), text.indexOf('surface: {'));
    expect(base(after)).toContain(`border: '${light.base.border}'`);
    expect(base(after)).toContain(`fg: '${theme.colors.dark!.base.fg}'`);
    const status = (text: string) => text.slice(text.indexOf('status: {'), text.indexOf('entity: {'));
    expect(status(after)).toBe(status(before));
    expect(after).toContain("divider: '#ECEBE7'");
  });

  it('adds a set per colored entity in each mode, and gives the same file when applied twice', () => {
    expect(after.match(/ {6}shelf: \{/g)).toHaveLength(2);
    expect(after).toContain(`bg: '${theme.colors.light!.entity.shelf!.bg}'`);
    expect(applyColors(after, theme)).toBe(after);
  });
});

describe('applyTokens', () => {
  it('sets the radius of surfaces and controls and the focus ring', () => {
    const after = applyTokens(template('tokens.ts'), {
      ...theme,
      radius: { surface: '16px', control: '10px' },
      focusRing: 'glow',
    });
    expect(after).toContain("surface: '16px'");
    expect(after).toContain("control: '10px'");
    expect(after).toContain("focusRing: 'glow'");
  });
});

describe('fonts', () => {
  it('loads the three families with next/font, ui first, at the weights the design system uses', () => {
    const module = fontsModule(theme);
    expect(module).toContain(
      "import { Inter, JetBrains_Mono, Playfair_Display } from 'next/font/google';",
    );
    expect(module).toContain(
      "const playfairDisplay = Playfair_Display({\n  subsets: ['latin'],\n  weight: ['400', '500', '600', '700'],\n  variable: '--font-display',",
    );
    expect(module).toContain('  inter.className,\n  inter.variable,');
  });

  it("gives Storybook the same families from Google Fonts, since next/font runs only in Next", () => {
    const head = previewHead(theme);
    expect(head).toContain('family=Playfair+Display:wght@400;500;600;700');
    expect(head).toContain("--font-display: 'Playfair Display';");
  });
});

describe('recipe defaults', () => {
  const button = template('packages/ui/src/Button/Button.recipes.css.ts');
  const variants = {
    variant: ['base', 'default', 'danger'],
    size: ['sm', 'md'],
    rounded: ['true', 'false'],
    ghost: ['true', 'false'],
  };

  it('turns a look into its flags and keeps every other default', () => {
    expect(variantValues(variants, { size: 'md', look: 'rounded ghost' })).toEqual({
      size: 'md',
      rounded: true,
      ghost: true,
    });
    expect(variantValues({ bordered: ['true', 'false'] }, { look: '!bordered' })).toEqual({
      bordered: false,
    });
    expect(variantValues({ border: ['outline', 'open'] }, { look: 'open' })).toEqual({
      border: 'open',
    });
  });

  it("writes them into the recipe's defaultVariants", () => {
    const after = applyRecipeDefaults(button, 'buttonRecipe', {
      size: 'md',
      ghost: true,
    });
    const defaults = after.slice(after.indexOf('defaultVariants'));
    expect(defaults).toMatch(/size: 'md'/);
    expect(defaults).toMatch(/ghost: true/);
    expect(defaults).toMatch(/variant: 'default'/);
  });
});
