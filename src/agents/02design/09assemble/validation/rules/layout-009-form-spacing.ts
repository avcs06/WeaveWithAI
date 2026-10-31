import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import type { Rect } from '../../skeleton/skeleton';
import type { LayoutInput } from '../helpers';

/**
 * LAYOUT-009 · mandatory · H-09 Form spacing
 * A form's stacked fields: field to field 16, a group of fields to the next
 * group 24. A row of controls, such as a search and filters, is a toolbar and
 * keeps a toolbar's gap; a group holds only fields (user, 2026-10-31).
 * Pass: title, author and shelf fields 16 apart.
 * Fail: the same fields 12 apart.
 */
export const rule = defineRule<LayoutInput>(
  'LAYOUT-009',
  'mandatory',
  ({ views }, fail) => {
    const issues: Issue[] = [];
    for (const view of views) {
      const input = (r: Rect) => view.node(r.id)?.role === 'input';
      const group = (r: Rect): boolean => {
        const kids = view.kids(r.id);
        return kids.length > 0 && kids.every((kid) => input(kid) || group(kid));
      };
      for (const rect of view.rects) {
        const parent = view.rect(rect.parent);
        if (!parent || view.layout(parent)?.direction !== 'column') continue;
        const siblings = view.kids(rect.parent);
        const before = siblings[siblings.indexOf(rect) - 1];
        if (!before || rect.gapBefore === null) continue;
        if (input(rect) && input(before) && rect.gapBefore !== 16)
          issues.push(
            fail(
              `${rect.id} is a field ${rect.gapBefore}px below the field ${before.id}. Stacked fields are 16px apart. Set the layout gap of ${rect.parent} to 16px (spacing key 4).`,
              rect.id,
            ),
          );
        if (group(rect) && group(before) && rect.gapBefore !== 24)
          issues.push(
            fail(
              `${rect.id} is a group of fields ${rect.gapBefore}px below the group of fields ${before.id}. Stacked groups of fields are 24px apart. Set the layout gap of ${rect.parent} to 24px (spacing key 6).`,
              rect.id,
            ),
          );
      }
    }
    return issues;
  },
);
