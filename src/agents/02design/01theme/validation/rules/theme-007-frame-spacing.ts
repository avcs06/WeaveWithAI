import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import { HEADER_PADDING_PX, SECTION_GAP_PX } from '../../../config';
import { spacingPx, type ThemeInput } from '../helpers';

type Direction = 'horizontal' | 'vertical';

/**
 * THEME-007 · mandatory
 * The spacing a layout gives every page of its kind, by direction: a part's
 * padding is at least the gap inside it running the same way, unless the
 * padding is 0. The main area's sections stack, 24 apart on app pages and 36
 * on marketing pages. A header's items sit in a row, inside the side padding
 * code fixes at 16. An app footer's items sit in a row, and a site footer's
 * lines stack. A sidebar takes its menu's spacing.
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
      // The part, the direction its gap runs, its padding and gap that way, and the field to change.
      const spaced: [string, Direction, number, number, 'padding' | 'gap'][] = [
        ['main', 'vertical', px(main.padding), SECTION_GAP_PX[kind], 'padding'],
      ];
      if (header.needed)
        spaced.push(['header', 'horizontal', HEADER_PADDING_PX.horizontal, px(header.gap), 'gap']);
      if (footer.needed)
        spaced.push([
          'footer',
          'content' in footer ? 'vertical' : 'horizontal',
          px(footer.padding),
          px(footer.gap),
          'padding',
        ]);
      for (const [name, direction, padding, gap, field] of spaced)
        if (padding > 0 && gap > padding)
          issues.push(
            fail(
              `The ${kind} ${name} has ${direction} padding ${padding} but a ${direction} gap of ${gap} inside it; the padding is never smaller than the gap running the same way. ${field === 'gap' ? `Code fixes the header's padding: make its gap at most ${padding}.` : `Make its padding at least ${gap}.`}`,
              `${kind}.${name}.${field}`,
            ),
          );
    }
    return issues;
  },
);
