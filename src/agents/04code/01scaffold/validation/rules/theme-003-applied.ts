import { defineRule } from '../../../../../core/rules';
import type { Theme } from '../../../../02design/01theme/build';
import { applyColors } from '../../apply';

export type AppliedInput = { colorsTs: string; theme: Theme };

/**
 * THEME-003 · mandatory
 * The app's colors.ts holds the theme's brand, base, page, entity and status
 * colors in every mode the theme has: applying the theme again changes nothing.
 * Pass: colors.ts as `applyTheme` wrote it.
 * Fail: one shade of the primary set changed after.
 */
export const rule = defineRule<AppliedInput>('THEME-003', 'mandatory', ({ colorsTs, theme }, fail) => {
  const expected = applyColors(colorsTs, theme).split('\n');
  return colorsTs
    .split('\n')
    .flatMap((line, i) =>
      line === expected[i]
        ? []
        : [fail(`colors.ts line ${i + 1} is "${line.trim()}" but the theme gives "${expected[i]?.trim()}". The scaffold wrote the wrong color.`, `colors.ts:${i + 1}`)],
    );
});
