import { wcagLuminance } from 'culori';
import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import { isHex, QUIET_PAIRS, ratio } from '../../build';
import type { ThemeInput } from '../helpers';

/** Enough to see a hairline or a placeholder shape, as the template's own divider is on its frame. */
const VISIBLE = 1.1;

/**
 * THEME-009 · mandatory
 * The colors that follow no hue show on the colors the theme chose: the
 * divider and the skeleton at least 1.1:1 on pageBg and frameBg, the skeleton
 * also on the base set's bg, where placeholders sit in cards, and the
 * backdrop darker than the page and the frame, so it dims them.
 * Pass: the reading-list theme, a #ECEBE7 divider on a white page.
 * Fail: the divider set to pageBg.
 */
export const rule = defineRule<ThemeInput>(
  'THEME-009',
  'mandatory',
  ({ theme }, fail) => {
    const issues: Issue[] = [];
    for (const mode of theme.modes) {
      const colors = theme.colors[mode];
      if (!colors) continue;
      const { page } = colors;
      const pairs: [string, string, string, string][] = [
        ...QUIET_PAIRS.map(
          ([fg, bg]) => [fg, bg, page[fg], page[bg]] as [string, string, string, string],
        ),
        ['skeleton', 'base bg', page.skeleton, colors.base.bg],
      ];
      for (const [fg, bg, a, b] of pairs) {
        const value = ratio(a, b);
        if (value < VISIBLE)
          issues.push(
            fail(
              `page ${mode}: ${fg} on ${bg} is ${value.toFixed(2)}:1; it needs ${VISIBLE}:1 to show.`,
              `page.${mode}.${fg}`,
            ),
          );
      }
      const dark = (hex: string) => (isHex(hex) ? wcagLuminance(hex) : Number.NaN);
      if (!(dark(page.backdrop) < Math.min(dark(page.pageBg), dark(page.frameBg))))
        issues.push(
          fail(
            `page ${mode}: the backdrop ${page.backdrop} is not darker than the page and the frame, so it cannot dim them behind a dialog.`,
            `page.${mode}.backdrop`,
          ),
        );
    }
    return issues;
  },
);
