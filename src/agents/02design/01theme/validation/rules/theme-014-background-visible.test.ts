import { describe, expect, it } from 'vitest';
import { runRules } from '../../../../../core/rules';
import { inventory, theme } from '../../../__fixtures__/chain';
import { readBackground } from '../../../background';
import { ratio } from '../../build';
import { rule } from './theme-014-background-visible';

const neonGrid = 'repeating-linear-gradient(0deg, transparent 0px 31px, oklch(0.20 0.015 195) 31px 32px), repeating-linear-gradient(90deg, transparent 0px 31px, oklch(0.20 0.015 195) 31px 32px), linear-gradient(180deg, oklch(0.17 0.009 195), oklch(0.20 0.015 195))';

describe('THEME-014', () => {
  const check = (background: string) => {
    const copy = structuredClone(theme);
    copy.colors.dark!.page.pageBackground = background;
    return runRules([rule], { theme: copy, inventory });
  };

  it('passes the reading-list gradients in both modes', () => {
    expect(runRules([rule], { theme, inventory })).toEqual([]);
  });

  it('fails the reported neon grid with the measured contrast', () => {
    const colors = readBackground(neonGrid).colors;
    expect(colors).toHaveLength(2);
    expect(ratio(colors[0]!, colors[1]!)).toBeCloseTo(1.05443, 5);
    expect(check(neonGrid)).toEqual([expect.objectContaining({
      rule: 'THEME-014', severity: 'mandatory', at: 'page.dark.pageBackground',
      message: expect.stringContaining('Raise the pattern'),
    })]);
  });

  it('allows a solid background and repeated instances of one color', () => {
    expect(check('#18181B')).toEqual([]);
    expect(check('linear-gradient(#18181B, #18181B)')).toEqual([]);
  });

  it('measures the extremes even when they are not the first and last stops', () => {
    expect(check('linear-gradient(#222222, #444444, #111111, #232323)')).toEqual([]);
    expect(check('linear-gradient(#222222, #232323, #242424)')).toHaveLength(1);
  });
});
