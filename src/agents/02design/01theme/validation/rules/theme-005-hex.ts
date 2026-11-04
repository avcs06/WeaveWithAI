import type { Issue } from '../../../../../core/issues';
import { readBackground } from '../../../background';
import { defineRule } from '../../../../../core/rules';
import { isHex } from '../../build';
import type { ThemeInput } from '../helpers';

/**
 * THEME-005 · mandatory
 * Every color is a hex value, #RRGGBB, and each page background is one CSS
 * background value of colors and gradients.
 * Pass: #2F6FB0.
 * Fail: a theme fg of "dark blue".
 */
export const rule = defineRule<ThemeInput>(
  'THEME-005',
  'mandatory',
  ({ theme }, fail) => {
    const issues: Issue[] = [];
    for (const mode of theme.modes) {
      const colors = theme.colors[mode];
      if (!colors) continue;
      const { pageBackground, ...page } = colors.page;
      const sets: [string, Record<string, string>][] = [
        ['theme', colors.theme],
        ['base', colors.base],
        ['page', page],
        ...Object.entries(colors.entity),
        ...Object.entries(colors.status),
      ];
      for (const problem of readBackground(pageBackground).problems)
        issues.push(
          fail(
            `colors ${mode}: background is "${pageBackground}", and ${problem}. Write one CSS background value made of colors and gradients only, such as "linear-gradient(180deg, #1B1A18 0%, #22201C 100%)".`,
            `colors.${mode}.background`,
          ),
        );
      for (const [name, set] of sets)
        for (const [role, value] of Object.entries(set))
          if (!isHex(value))
            issues.push(
              fail(
                `${name} ${mode}: ${role} is "${value}"; give a hex value like #2F6FB0.`,
                `${name}.${mode}.${role}`,
              ),
            );
    }
    return issues;
  },
);
