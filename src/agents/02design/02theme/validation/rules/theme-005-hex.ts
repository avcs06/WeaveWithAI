import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import { isHex } from '../../build';
import type { ThemeInput } from '../helpers';

/**
 * THEME-005 · mandatory
 * Every color is a hex value, #RRGGBB.
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
      const sets: [string, Record<string, string>][] = [
        ['theme', colors.theme],
        ['page', colors.page],
        ...Object.entries(colors.entity),
      ];
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
