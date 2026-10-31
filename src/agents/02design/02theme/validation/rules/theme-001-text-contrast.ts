import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import {
  colorSets,
  PAGE_PAIRS,
  ratio,
  SURFACE_SETS,
  SURFACE_TEXT_PAIRS,
  TEXT_PAIRS,
} from '../../build';
import type { ThemeInput } from '../helpers';

/**
 * THEME-001 · mandatory
 * 4.5:1 for fg and fgMuted on bg, fg on hoverBg, accentFg on accentBg and
 * accentHoverBg, for the theme, base and every entity set; for pageFg and
 * pageFgMuted on pageBg and frameBg; and for the theme's and base's fg on
 * pageBg and frameBg, where a link draws it; in every mode the theme has.
 * Pass: the reading-list theme.
 * Fail: fgMuted set to the bg color.
 */
export const rule = defineRule<ThemeInput>(
  'THEME-001',
  'mandatory',
  ({ theme }, fail) => {
    const issues: Issue[] = [];
    const check = (name: string, mode: string, fg: string, bg: string, a: string, b: string) => {
      const value = ratio(a, b);
      if (value < 4.5)
        issues.push(
          fail(
            `${name} ${mode}: ${fg} on ${bg} is ${value.toFixed(2)}:1; text needs 4.5:1.`,
            `${name}.${mode}.${fg}`,
          ),
        );
    };
    for (const mode of theme.modes) {
      const colors = theme.colors[mode];
      if (!colors) continue;
      const { page } = colors;
      for (const [fg, bg] of PAGE_PAIRS)
        check('page', mode, fg, bg, page[fg], page[bg]);
      for (const name of SURFACE_SETS)
        for (const [fg, bg] of SURFACE_TEXT_PAIRS)
          check(name, mode, fg, bg, colors[name][fg], page[bg]);
    }
    for (const { name, mode, colors } of colorSets(theme))
      for (const [fg, bg] of TEXT_PAIRS)
        check(name, mode, fg, bg, colors[fg], colors[bg]);
    return issues;
  },
);
