import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import { SECTION_GAP_PX } from '../../../config';
import { spacingPx, type ThemeInput } from '../helpers';

/**
 * THEME-007 · mandatory
 * The spacing a layout gives every page of its kind: the main area padded at
 * least as much as the gap between its sections, 24 on app pages and 36 on
 * marketing pages, and a needed header or footer at least as much as the gap
 * inside it, unless the padding is 0. A sidebar takes its menu's spacing.
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
      const { main, header, footer } = theme.layouts[kind];
      const padded: [string, number, number][] = [
        ['main', px(main.padding), SECTION_GAP_PX[kind]],
      ];
      for (const [name, part] of Object.entries({
        header,
        footer,
      }))
        if (part.needed) padded.push([name, px(part.padding), px(part.gap)]);
      for (const [name, padding, gap] of padded)
        if (padding > 0 && gap > padding)
          issues.push(
            fail(
              `The ${kind} ${name} has padding ${padding} but a gap of ${gap} inside it; the padding is never smaller than the gap.`,
              `${kind}.${name}.padding`,
            ),
          );
    }
    return issues;
  },
);
