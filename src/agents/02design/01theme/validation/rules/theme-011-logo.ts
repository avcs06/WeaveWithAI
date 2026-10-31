import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import { ratio } from '../../build';
import { googleFont } from '../../fonts';
import type { ThemeInput } from '../helpers';

/**
 * THEME-011 · mandatory
 * The wordmark (user, 2026-11-01): its weight is one its font ships, and its
 * color reads at 3:1 on the frame and on the page in each mode, as large
 * text does, since an overlay header puts it on the page.
 * Pass: the reading-list theme, Playfair Display 600.
 * Fail: a wordmark in the frame's own color.
 */
export const rule = defineRule<ThemeInput>('THEME-011', 'mandatory', ({ theme }, fail) => {
  const issues: Issue[] = [];
  const { logo } = theme;
  const weights = googleFont(logo.family)?.weights ?? [];
  if (!weights.includes(logo.weight))
    issues.push(fail(`logo weight is ${logo.weight}, but ${logo.family} ships ${weights.join(', ') || 'no weights'}. Pick one of those weights, or another of the brief's fonts.`, 'logo.weight'));
  for (const mode of theme.modes) {
    const color = logo.colors[mode];
    const page = theme.colors[mode]?.page;
    if (!color || !page) continue;
    for (const on of ['frameBg', 'pageBg'] as const) {
      const r = ratio(color, page[on]);
      if (!(r >= 3))
        issues.push(fail(`logo ${mode}: the wordmark's ${color} on ${on} ${page[on]} is ${Number.isNaN(r) ? 'not a hex pair' : `${r.toFixed(2)}:1`}. The wordmark reads at 3:1 on the frame and the page. Pick a logo step further from both.`, `logo.${mode}.${on}`));
    }
  }
  return issues;
});
