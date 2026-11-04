import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

import { recipeDefaults } from './recipe-defaults.js';

const dir = mkdtempSync(join(tmpdir(), 'recipe-defaults-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));
const file = join(dir, 'Button.recipes.css.ts');
writeFileSync(
  file,
  `import { recipe } from '@vanilla-extract/recipes';
export const buttonRecipe = recipe({
  base: {},
  variants: {
    variant: { default: {}, danger: {} },
    size: { sm: {}, md: {} },
    ghost: { true: {}, false: {} },
    selection: { outline: {}, filled: {} },
  },
  defaultVariants: { variant: 'default', size: 'sm', ghost: false },
});
export const otherRecipe = recipe({ variants: {} });
`,
);

describe('recipeDefaults', () => {
  it('reads the defaults and every variant of the named recipe', () => {
    const found = recipeDefaults(file, 'buttonRecipe');
    expect(found?.defaults).toEqual({ variant: 'default', size: 'sm', ghost: 'false' });
    expect(found?.variants).toEqual([
      { name: 'variant', values: ['default', 'danger'], boolean: false, default: 'default' },
      { name: 'size', values: ['sm', 'md'], boolean: false, default: 'sm' },
      { name: 'ghost', values: ['true', 'false'], boolean: true, default: 'false' },
      { name: 'selection', values: ['outline', 'filled'], boolean: false, default: undefined },
    ]);
  });

  it('finds nothing for a name the file does not bind', () => {
    expect(recipeDefaults(file, 'cardRecipe')).toBeUndefined();
  });
});
