import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import { isColumn, type LayoutInput } from '../helpers';

/**
 * LAYOUT-019 · mandatory · H-19 Centre whole blocks or nothing
 * A centred column holds no full-width text (it would read left-aligned), and a
 * left-aligned column with text holds no centred block of text.
 * Pass: a centred hero whose title and line size to their content.
 * Fail: the same hero with its line filling the width.
 */
export const rule = defineRule<LayoutInput>(
  'LAYOUT-019',
  'mandatory',
  ({ views }, fail) => {
    const issues: Issue[] = [];
    for (const view of views)
      for (const rect of view.rects) {
        const layout = view.layout(rect);
        if (!layout || !isColumn(layout)) continue;
        const kids = view.kids(rect.id);
        if (layout.align === 'center') {
          for (const kid of kids)
            if (kid.kind === 'text' && view.node(kid.id)?.box.width === 'fill')
              issues.push(
                fail(
                  `${kid.id} is text with box width fill, inside ${rect.id}, a column with layout align center. Its lines read left-aligned. Text in a column with layout align center has box width content or fixed, so the column centres it as one block. Set the box width of ${kid.id} to content, or to fixed with a widthPx.`,
                  kid.id,
                ),
              );
          continue;
        }
        const text = kids.some((kid) => kid.kind === 'text');
        for (const kid of kids) {
          const own = view.layout(kid);
          // In a row, align is vertical; only a centred column is a centred block.
          const centred =
            own?.direction === 'column' &&
            own.align === 'center' &&
            view.kids(kid.id).some((k) => k.kind === 'text');
          if (text && centred)
            issues.push(
              fail(
                `${kid.id} is a column with layout align center, inside ${rect.id}, which holds text and has layout align ${layout.align}. A column with text is centred as a whole or not at all. Set the layout align of ${kid.id} to ${layout.align}, or set the layout align of ${rect.id} to center so the whole column is centred.`,
                kid.id,
              ),
            );
        }
      }
    return issues;
  },
);
