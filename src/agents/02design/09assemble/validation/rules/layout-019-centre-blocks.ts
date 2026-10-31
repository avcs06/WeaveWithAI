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
                  `${kid.id} fills the centred block ${rect.id}, so its text reads left-aligned; give it a content or fixed width so the block centres as a whole.`,
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
                `${kid.id} centres its text inside the left-aligned ${rect.id}; centre the whole block or nothing.`,
                kid.id,
              ),
            );
        }
      }
    return issues;
  },
);
