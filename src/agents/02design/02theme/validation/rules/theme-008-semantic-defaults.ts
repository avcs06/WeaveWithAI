import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import type { ThemeInput } from '../helpers';

/** Variant values that carry meaning; a default never changes to or from one. */
const MEANINGFUL = /^(danger|success|error|warning|info|icon-.*)$/;

/**
 * THEME-008 · mandatory
 * A default that carries meaning stays the recipe's: a status, a danger or
 * status variant, an icon-only size, and a dialog's size. Variants such as
 * base or default and every look are the theme's to choose.
 * Pass: Button variant default, size sm, look ghost.
 * Fail: Button size icon-sm, which makes every button an icon button.
 */
export const rule = defineRule<ThemeInput>(
  'THEME-008',
  'mandatory',
  ({ theme, inventory }, fail) => {
    const issues: Issue[] = [];
    const recipes = new Map(inventory.components.map((c) => [c.name, c]));
    for (const [name, values] of Object.entries(theme.defaults))
      for (const [prop, value] of Object.entries(values)) {
        if (prop === 'look') continue;
        const recipe = String(recipes.get(name)?.defaults?.[prop] ?? '');
        const meaningful =
          prop === 'status' ||
          (name === 'Dialog' && prop === 'size') ||
          MEANINGFUL.test(value) ||
          MEANINGFUL.test(recipe);
        if (meaningful && value !== recipe)
          issues.push(
            fail(
              `${name} ${prop} defaults to ${value}, but it carries meaning; keep the design system's ${recipe || 'default'}.`,
              `defaults.${name}.${prop}`,
            ),
          );
      }
    return issues;
  },
);
