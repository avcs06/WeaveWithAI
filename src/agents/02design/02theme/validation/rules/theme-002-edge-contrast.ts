import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import {
  colorSets,
  EDGE_PAIRS,
  ratio,
  SURFACE_EDGE_PAIRS,
  SURFACE_SETS,
} from '../../build';
import type { ThemeInput } from '../helpers';

/**
 * THEME-002 · warning
 * 3:1 for border and focus on bg, and for the theme's and base's border and
 * focus on pageBg and frameBg, where a link draws its underline and focus ring.
 * Pass: the reading-list theme.
 * Fail: border set to the bg color.
 */
export const rule = defineRule<ThemeInput>(
  'THEME-002',
  'warning',
  ({ theme }, fail) => {
    const issues: Issue[] = [];
    const check = (name: string, mode: string, edge: string, bg: string, a: string, b: string) => {
      const value = ratio(a, b);
      if (value < 3)
        issues.push(
          fail(
            `${name} ${mode}: ${edge} on ${bg} is ${value.toFixed(2)}:1; borders and focus rings need 3:1.`,
            `${name}.${mode}.${edge}`,
          ),
        );
    };
    for (const { name, mode, colors } of colorSets(theme))
      for (const [edge, bg] of EDGE_PAIRS)
        check(name, mode, edge, bg, colors[edge], colors[bg]);
    for (const mode of theme.modes) {
      const colors = theme.colors[mode];
      if (!colors) continue;
      for (const name of SURFACE_SETS)
        for (const [edge, bg] of SURFACE_EDGE_PAIRS)
          check(name, mode, edge, bg, colors[name][edge], colors.page[bg]);
    }
    return issues;
  },
);
