import { wcagLuminance } from 'culori';
import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import { readBackground } from '../../../background';
import { ratio } from '../../build';
import type { ThemeInput } from '../helpers';

/**
 * THEME-014 · mandatory
 * A background with several colors needs 1.1:1 between its extremes.
 * Pass: the reading-list paper gradient.
 * Fail: the neon grid from OKLCH lightness 0.17 to 0.20.
 */
export const rule = defineRule<ThemeInput>(
  'THEME-014',
  'mandatory',
  ({ theme }, fail) => {
    const issues: Issue[] = [];
    for (const mode of theme.modes) {
      const page = theme.colors[mode]?.page;
      if (!page) continue;
      const colors = readBackground(page.pageBackground).colors
        .sort((a, b) => wcagLuminance(a) - wcagLuminance(b));
      if (colors.length < 2) continue;
      const value = ratio(colors[0]!, colors[colors.length - 1]!);
      if (value < 1.1)
        issues.push(fail(
          `page ${mode}: the background's lightest and darkest colors are ${value.toFixed(2)}:1 apart; they need at least 1.1:1 to show. Raise the pattern's lines or the gradient's far stop to a lighter step, and keep page text readable on every color.`,
          `page.${mode}.pageBackground`,
        ));
    }
    return issues;
  },
);
