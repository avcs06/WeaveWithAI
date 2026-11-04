import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import { colorSets, ratio } from '../../build';
import type { ThemeInput } from '../helpers';

/**
 * THEME-015 · mandatory
 * Muted text sits clearly apart from normal text: 2:1 for fgMuted against fg
 * in the theme, base, every entity and every status set, and for pageFgMuted
 * against pageFg; in every mode the theme has.
 * Pass: the reading-list theme, fgMuted and pageFgMuted on step 10.
 * Fail: fgMuted on step 11 next to fg on step 12, 1.67:1 apart.
 */
export const rule = defineRule<ThemeInput>(
  'THEME-015',
  'mandatory',
  ({ theme }, fail) => {
    const issues: Issue[] = [];
    const check = (name: string, mode: string, muted: string, fg: string, a: string, b: string, bg: string) => {
      const value = ratio(a, b);
      if (value < 2)
        issues.push(
          fail(
            `${name} ${mode}: ${muted} ${a} is ${value.toFixed(2)}:1 from ${fg} ${b}; muted text needs 2:1 from ${fg} so it reads as secondary. Pick a step for ${muted} further from ${fg}'s, such as 10 when ${fg} is 12, and keep 4.5:1 on ${bg}.`,
            `${name}.${mode}.${muted}`,
          ),
        );
    };
    for (const mode of theme.modes) {
      const page = theme.colors[mode]?.page;
      if (page)
        check('page', mode, 'pageFgMuted', 'pageFg', page.pageFgMuted, page.pageFg, 'pageBg, frameBg and every color of the background');
    }
    for (const { name, mode, colors } of colorSets(theme))
      check(name, mode, 'fgMuted', 'fg', colors.fgMuted, colors.fg, 'bg');
    return issues;
  },
);
