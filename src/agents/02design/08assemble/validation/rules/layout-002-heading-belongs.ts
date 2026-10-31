import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import { isColumn, isHeading, type LayoutInput } from '../helpers';

/**
 * LAYOUT-002 · mandatory · H-02 A heading belongs to what follows
 * In a column, the space above a heading is at least 1.5 times the space below it.
 * Pass: 24 above a section heading, 12 below it.
 * Fail: a heading 8 below a note and 8 above its tag.
 */
export const rule = defineRule<LayoutInput>(
  'LAYOUT-002',
  'mandatory',
  ({ views }, fail) => {
    const issues: Issue[] = [];
    for (const view of views)
      for (const rect of view.rects) {
        const parent = view.rect(rect.parent);
        if (
          !isHeading(view.node(rect.id)) ||
          !parent ||
          !isColumn(view.layout(parent))
        )
          continue;
        const siblings = view.kids(parent.id);
        const next = siblings[siblings.indexOf(rect) + 1];
        const above = rect.gapBefore;
        const below = next?.gapBefore;
        if (above === null || below === undefined || below === null) continue;
        if (above < 1.5 * below)
          issues.push(
            fail(
              `${rect.id} is a heading with ${above}px above it and ${below}px below it. The space above a heading is at least 1.5 times the space below it, so the heading reads with what follows. Put ${rect.id} first in a column node of its own with the nodes it heads, and give that column a layout gap of at most ${Math.floor(above / 1.5)}px.`,
              rect.id,
            ),
          );
      }
    return issues;
  },
);
