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
              `${rect.id} has ${above} above it and ${below} below it; a heading belongs to what follows, so give it at least ${1.5 * below} above.`,
              rect.id,
            ),
          );
      }
    return issues;
  },
);
