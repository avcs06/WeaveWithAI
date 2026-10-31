import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { isColumn, isHeading, type LayoutInput } from './layout-helpers';

/**
 * LAYOUT-012 · warning · H-12 Title and description
 * A description sits 4 below its title, and the content 12 to 16 below the description.
 * Pass: a page title, its line 4 below, the first field 16 below that.
 * Fail: the line 12 below the title.
 */
export const rule = defineRule<LayoutInput>(
  'LAYOUT-012',
  'warning',
  ({ views }, fail) => {
    const issues: Issue[] = [];
    for (const view of views)
      for (const rect of view.rects) {
        const parent = view.rect(rect.parent);
        if (
          !parent ||
          !isColumn(view.layout(parent)) ||
          !isHeading(view.node(rect.id))
        )
          continue;
        const siblings = view.kids(parent.id);
        const index = siblings.indexOf(rect);
        const text = siblings[index + 1];
        if (!text || view.node(text.id)?.role !== 'text') continue;
        if (text.gapBefore !== 4)
          issues.push(
            fail(
              `${text.id} is ${text.gapBefore} below its title ${rect.id}; a description sits 4 below its title.`,
              text.id,
            ),
          );
        // The content follows the description, or the group the two make.
        // A node grouping just the two; a section's next sibling is a section.
        const group =
          siblings.length === 2 && view.node(parent.id) ? parent : text;
        const outer = view.rect(group.parent);
        const after =
          outer && isColumn(view.layout(outer))
            ? view.kids(outer.id)
            : group === text
              ? siblings
              : [];
        const content = after[after.indexOf(group) + 1];
        const gap = content?.gapBefore;
        if (
          content &&
          gap !== null &&
          gap !== undefined &&
          (gap < 12 || gap > 16)
        )
          issues.push(
            fail(
              `${content.id} is ${gap} below the description of ${rect.id}; content follows a description at 12 to 16.`,
              content.id,
            ),
          );
      }
    return issues;
  },
);
