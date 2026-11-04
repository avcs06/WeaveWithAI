import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import { SECTION_GAP_PX } from '../../../config';
import { spacingPx, type ThemeInput } from '../helpers';

type Direction = 'horizontal' | 'vertical';

/**
 * THEME-007 · mandatory
 * The spacing a layout gives every page of its kind, by direction: a part's
 * padding is at least the gap inside it running the same way, unless the
 * padding is 0. The main area's sections stack, 24 apart on app pages and 36
 * on marketing pages. An app footer's items sit in a row, and a site footer's
 * lines stack. Code fixes the header's padding and gap, and a sidebar takes
 * its menu's spacing.
 * Pass: the reading-list layouts, page paddings of 24 and 36.
 * Fail: an app page padded 16.
 */
export const rule = defineRule<ThemeInput>(
  'THEME-007',
  'mandatory',
  ({ theme, inventory }, fail) => {
    const issues: Issue[] = [];
    const px = spacingPx(inventory);
    for (const kind of ['app', 'marketing'] as const) {
      const { main, footer } = theme.layouts[kind];
      // The part, the direction its gap runs, and its padding and gap that way.
      const spaced: [string, Direction, number, number][] = [
        ['main', 'vertical', px(main.padding), SECTION_GAP_PX[kind]],
      ];
      if (footer.needed)
        spaced.push([
          'footer',
          'content' in footer ? 'vertical' : 'horizontal',
          px(footer.padding),
          px(footer.gap),
        ]);
      for (const [name, direction, padding, gap] of spaced)
        if (padding > 0 && gap > padding)
          issues.push(
            fail(
              `The ${kind} ${name} has ${direction} padding ${padding} but a ${direction} gap of ${gap} inside it; the padding is never smaller than the gap running the same way. Make its padding at least ${gap}.`,
              `${kind}.${name}.padding`,
            ),
          );
    }
    return issues;
  },
);
