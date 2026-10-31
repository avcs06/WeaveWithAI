import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import type { LayoutInput } from '../helpers';

/**
 * LAYOUT-014 · warning · H-14 Negative space follows hierarchy
 * Padding by kind: a hero on a public page 48 to 64, a padded section 24 to 32.
 * A card's or a dialog's own padding is the design system's and is not checked.
 * Pass: a hero with padding 48, a side panel with 24.
 * Fail: a hero with 32.
 */
export const rule = defineRule<LayoutInput>(
  'LAYOUT-014',
  'warning',
  ({ views }, fail) => {
    const issues: Issue[] = [];
    for (const view of views)
      for (const rect of view.rects) {
        const padding = Math.min(...rect.padding);
        const section = view.section(rect.id);
        const check = (what: string, low: number, high: number) => {
          if (padding < low || padding > high)
            issues.push(
              fail(
                `${rect.id} has padding ${padding}; ${what} takes ${low} to ${high}.`,
                rect.id,
              ),
            );
        };
        if (section?.kind === 'hero' && view.screen.access === 'public')
          check('a hero on a public page', 48, 64);
        else if (section && padding > 0) check('a padded section', 24, 32);
      }
    return issues;
  },
);
